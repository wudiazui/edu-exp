import { math2img, replacePunctuation} from "../lib.js";


console.log('hello from content_scripts');

//const img = await math2img("\frac{2}{3}");

//console.log(img);


function cleanPTags(html) {
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
  function processTextContent(textNode) {
    let text = textNode.textContent
      .replace(/[\x20\t\n]/g, function(match) {
        switch (match) {
          case ' ': return ' ';
          case '\t': return '\t';
          case '\n': return '\n';
          default: return match;
        }
      });

    // 使用 replacePunctuation 处理文本
    return replacePunctuation(text);
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
        convertToParagraphs(child);
      }
    });
  }

  // 第二步：处理p标签内容，保留文本、图片和换行
  function cleanParagraph(p) {
    // 将所有节点转换为数组并记录其类型
    const nodes = Array.from(p.childNodes).map(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        return {
          type: 'text',
          content: processTextContent(node)
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
        content: processTextContent(node)
      };
    });

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
  Array.from(pElements).forEach(cleanParagraph);

  return container.outerHTML;
}


function createEvent(eventName) {
  const event = new Event(eventName, { bubbles: true, cancelable: true });
  return event;
}


// 添加一个变量来存储复制的HTML
let copiedHTML = '';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
      temp.innerHTML = cleanPTags(selectedElement.outerHTML);
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
});
