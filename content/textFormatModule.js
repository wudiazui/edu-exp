// Text formatting module
import { replacePunctuation, cleanHtmlContent } from "../lib.js";

/**
 * Cleans HTML content by removing styles and standardizing paragraph structure
 * @param {string} html - The HTML content to clean
 * @param {boolean} [replacePunctuations=true] - Whether to replace punctuations
 * @param {boolean} [removeStylesEnabled=true] - Whether to remove styles from elements
 * @returns {Promise<string>} - The cleaned HTML content
 */
async function cleanPTags(html, replacePunctuations = true, removeStylesEnabled = true) {
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
  
  // 修改文本处理函数，使用 cleanHtmlContent 进行HTML实体处理和标点符号替换
  async function processTextContent(textNode) {
    // 获取原始内容
    let text = textNode.textContent;
    
    // 如果是元素节点，获取innerHTML以保留HTML实体
    if (textNode.nodeType === Node.ELEMENT_NODE && textNode.innerHTML) {
      text = textNode.innerHTML;
    }
    
    // 使用 cleanHtmlContent 函数进行更全面的HTML清理
    // 这里只解码HTML实体，不移除标签，因为我们需要保留结构
    text = cleanHtmlContent(text, {
      removeBrTags: false,        // 不移除br标签，后续单独处理
      removeParagraphBreaks: false, // 不移除段落分隔
      removeAllTags: false,       // 不移除所有标签，只清理实体
      decodeEntities: true        // 解码HTML实体
    });
    
    // 处理空白字符规范化
    text = text.replace(/[\x20\t\n]/g, function(match) {
      switch (match) {
        case ' ': return ' '; // 将HTML空格（\x20）转换为正常空格
        case '\t': return '\t';
        case '\n': return '\n';
        default: return match;
      }
    });
    // 删除所有空白字符（包括用户手敲的空格和解码后的&nbsp;）
    text = text.replace(/\s+/g, '');

    // 根据参数决定是否替换标点符号
    return replacePunctuations ? replacePunctuation(text) : text;
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

  // 第二步：处理p标签内容，保留文本、图片、换行和下划线标签
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
        } else if (node.tagName.toLowerCase() === 'u') {
          return {
            type: 'u',
            node: node.cloneNode(true)
          };
        } else if (node.tagName.toLowerCase() === 'span' && !removeStylesEnabled) {
          return {
            type: 'span',
            node: node.cloneNode(true)
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
      } else if (item.type === 'u') {
        p.appendChild(item.node);
      } else if (item.type === 'span') {
        p.appendChild(item.node);
      }
    });
  }

  // 移除所有样式（根据参数决定是否执行）
  if (removeStylesEnabled) {
    removeStyles(temp);
  }
  convertToParagraphs(temp);

  const pElements = temp.getElementsByTagName('p');
  for (const p of pElements) { // 使用 for...of 循环
    await cleanParagraph(p);
  }

  return temp.innerHTML;
}

export { cleanPTags };
