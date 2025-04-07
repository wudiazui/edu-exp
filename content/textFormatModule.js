// Text formatting module
import { replacePunctuation } from "../lib.js";

/**
 * Cleans HTML content by removing styles and standardizing paragraph structure
 * @param {string} html - The HTML content to clean
 * @returns {Promise<string>} - The cleaned HTML content
 */
async function cleanPTags(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // 移除所有style属性
  function removeStyles(element) {
    // 如果是 img 标签则跳过
    if (element.tagName.toLowerCase() !== 'img') {
      element.removeAttribute('style');
      Array.from(element.children).forEach(child => removeStyles(child));
    }
  }
  
  // 修改文本处理函数，添加标点符号替换和HTML实体处理
  async function processTextContent(textNode) {
    // 获取原始内容
    let text = textNode.textContent;
    
    // 如果是元素节点，获取innerHTML以保留HTML实体
    if (textNode.nodeType === Node.ELEMENT_NODE && textNode.innerHTML) {
      text = textNode.innerHTML;
    }
    
    // 处理HTML非断空格实体
    // 1. 直接替换字符串形式的&nbsp;实体
    text = text.replace(/&nbsp;/g, ' ');
    // 2. 处理已解码的非断空格字符 (Unicode: \u00A0)
    text = text.replace(/\u00A0/g, ' ');
    
    // 处理其他空白字符
    text = text.replace(/[\x20\t\n]/g, function(match) {
      switch (match) {
        case ' ': return ' '; // 将HTML空格（\x20）转换为正常空格
        case '\t': return '\t';
        case '\n': return '\n';
        default: return match;
      }
    });

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
            const newP = document.createElement('p');
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
  removeStyles(temp);
  convertToParagraphs(temp);

  const pElements = temp.getElementsByTagName('p');
  for (const p of pElements) { // 使用 for...of 循环
    await cleanParagraph(p);
  }

  return temp.innerHTML;
}

export { cleanPTags };
