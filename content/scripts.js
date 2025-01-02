import { math2img, replaceLatexWithImages, } from "../lib.js";


console.log('hello from content_scripts');


// 添加一个变量来存储复制的HTML
let copiedHTML = '';

let host; // 声明 host 变量

// 从 Chrome 存储中同步读取 host 参数
chrome.storage.sync.get(['host'], (result) => {
  host = result.host; // 获取 host 值
});


async function cleanPTags(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const container = doc.body.firstElementChild;

  // 移除所有style属性
  function removeStyles(element) {
    // 如果是 img 标签则跳过
    if (element.tagName.toLowerCase() !== 'img') {
      element.removeAttribute('style');
      Array.from(element.children).forEach(child => removeStyles(child));
    }
  }
  // 修改文本处理函数，添加标点符号替换
  async function processTextContent(textNode) {
    let text = textNode.textContent
      .replace(/[\x20\t\n]/g, function(match) {
        switch (match) {
          case ' ': return ' ';
          case '\t': return '\t';
          case '\n': return '\n';
          default: return match;
        }
      });

    try {
      const response = await chrome.runtime.sendMessage(
        { type: 'TEXT_FORMAT', data: text, host: host }
      );
      if (response && response.formatted) {
        return response.formatted;
      }
      console.log(response)
      return text
    } finally {
      console.log("processTextContent end")
    }
  }

  // 第一步：将所有非p标签的内容块转换为p标签
  function convertToParagraphs(element) {
    const children = Array.from(element.children);

    children.forEach(child => {
      if (child.tagName.toLowerCase() !== 'p') {
        // 如果是块级元素，将其转换为p
        if (getComputedStyle(child).display === 'block' ||
          ['div', 'ul', 'ol', 'li', 'section', 'article', 'pre', 'code'].includes(child.tagName.toLowerCase())) {
            const newP = doc.createElement('p');
            // 复制原始元素的内容到新p标签
            newP.innerHTML = child.innerHTML;
            child.parentNode.replaceChild(newP, child);
          }
        // 递归处理嵌套元素
        convertToParagraphs(child); // 确保在转换后检查子元素
      }
    });
  }

  // 第二步：处理p标签内容，保留文本、图片和换行
  async function cleanParagraph(p) {
    // 将所有节点转换为数组并记录其类型
    const nodes = await Promise.all(Array.from(p.childNodes).map(async node => { // 使用 Promise.all
      if (node.nodeType === Node.TEXT_NODE) {
        return {
          type: 'text',
          content: await processTextContent(node) // 确保使用 await
        };
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName.toLowerCase() === 'img') {
          return {
            type: 'img',
            node: node.cloneNode(true)
          };
        } else if (node.tagName.toLowerCase() === 'br') {
          return {
            type: 'br'
          };
        }
      }
      return {
        type: 'text',
        content: await processTextContent(node) // 确保使用 await
      };
    }));

    while (p.firstChild) {
      p.removeChild(p.firstChild);
    }

    // 按原始顺序重建内容
    nodes.forEach(item => {
      if (item.type === 'text') {
        p.appendChild(document.createTextNode(item.content));
      } else if (item.type === 'img') {
        p.appendChild(item.node);
      } else if (item.type === 'br') {
        p.appendChild(document.createElement('br'));
      }
    });
  }

  // 移除所有样式
  removeStyles(container);
  convertToParagraphs(container);

  const pElements = container.getElementsByTagName('p');
  for (const p of pElements) { // 使用 for...of 循环
    await cleanParagraph(p);
  }

  return container.outerHTML;
}


function createEvent(eventName) {
  const event = new Event(eventName, { bubbles: true, cancelable: true });
  return event;
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "font_format") {
    const selectedElement = document.activeElement;
    if (selectedElement) {
      // 保存滚动位置
      const scrollTop = selectedElement.scrollTop;
      const scrollLeft = selectedElement.scrollLeft;

      // 保存选区位置
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;

      // 创建一个临时容器来解析清理后的HTML
      const temp = document.createElement('div');
      temp.innerHTML = await cleanPTags(selectedElement.outerHTML);
      const cleanedElement = temp.firstElementChild;

      // 复制原始元素的属性到清理后的元素
      Array.from(selectedElement.attributes).forEach(attr => {
        cleanedElement.setAttribute(attr.name, attr.value);
      });

      // 使用 replaceWith 替换元素（保持引用）
      selectedElement.replaceWith(cleanedElement);

      // 恢复滚动位置
      cleanedElement.scrollTop = scrollTop;
      cleanedElement.scrollLeft = scrollLeft;

      // 重新聚焦到元素
      cleanedElement.focus();

      // 触发change事件
      cleanedElement.dispatchEvent(createEvent('change'));
    }
    return true;
  };

  if (request.action === "copy_html") {
    const selection = window.getSelection();
    console.log(selection);
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // 创建一个新的容器来存储选中的内容
      const container = document.createElement('div');
      // 克隆选中内容，包括所有子元素和文本
      container.appendChild(range.cloneContents());
      // 获取完整的HTML，包括所有标签和文本内容
      const fullHTML = container.innerHTML;
      // 发送到background script存储
      chrome.runtime.sendMessage({
        action: "store_copied_html",
        html: fullHTML
      });
    }
    return true;
  }

  if (request.action === "paste_html") {
    // 从background script获取存储的HTML
    chrome.runtime.sendMessage({ action: "get_copied_html" }, response => {
      if (response.html) {
        // 获取当前活动元素
        const activeElement = document.activeElement;

        // 创建临时容器
        const temp = document.createElement('div');
        temp.innerHTML = response.html;

        // 将所有内容（包括文本节点）追加到活动元素中
        const fragment = document.createDocumentFragment();
        while (temp.firstChild) {
          fragment.appendChild(temp.firstChild);
        }

        activeElement.appendChild(fragment);
      }
    });
    return true;
  }
  if (request.action === "send_topic") {
    const activeElement = document.activeElement;
    if (activeElement) {
      // 创建临时容器并复制内容
      const temp = document.createElement('div');
      temp.innerHTML = activeElement.innerHTML;

      // 提取文本内容，保留特殊字符
      const extractText = (element, seenTexts = new Set()) => {
        let text = '';
        const childNodes = element.childNodes;

        for (const node of childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            // 保留前后的空格
            const content = node.textContent;
            if (!seenTexts.has(content)) {
              text += content; // 直接添加文本内容
              seenTexts.add(content); // 记录已添加的文本
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            // 对于 BR 标签，添加换行符
            if (node.tagName.toLowerCase() === 'br') {
              text += '\n'; // 添加换行符
            } else if (node.tagName.toLowerCase() === 'p') {
              // 逐行提取p标签的文本
              text += extractText(node, seenTexts) + '\n'; // 添加换行符
            } else if (node.tagName.toLowerCase() === 'img') {
              // 提取data-math属性并用$包裹，进行URL解码
              const mathValue = node.getAttribute('data-math');
              if (mathValue) {
                const decodedValue = decodeURIComponent(mathValue); // URL解码
                if (!seenTexts.has(decodedValue)) {
                  text += `$${decodedValue}$`; // 用$包裹
                  seenTexts.add(decodedValue); // 记录已添加的文本
                }
              }
            }
            // 递归处理子元素
            text += extractText(node, seenTexts);
          }
        }
        return text;
      };

      const cleanText = extractText(temp);

      // 发送到 background script
      chrome.runtime.sendMessage({
        action: "store_topic_html",
        html: cleanText
      });
    }
    return true;
  }

  if (request.action === "format_math") {
    // 把异步操作包装在立即执行的异步函数中
    (async () => {
      try {
        const activeElement = document.activeElement;
        if (!activeElement) {
          sendResponse({ success: false, error: 'No active element found' });
          return;
        }

        const temp = document.createElement('div');
        temp.innerHTML = activeElement.innerHTML;
        console.log("no-replace:   ", temp.innerHTML);

        const result = await replaceLatexWithImages(temp.innerHTML);
        console.log("replace:   ", result);
        activeElement.innerHTML = result;

        console.log({ success: true });
      } catch (error) {
        console.error({ success: false, error: error.message });
      }
    })();

    return true; // 保持消息通道开启
  }
});
