console.log('hello from content_scripts');


function cleanPTags(html) {
  // 创建一个DOM解析器
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 获取主容器
  const container = doc.body.firstElementChild;

  // 移除所有style属性
  function removeStyles(element) {
    element.removeAttribute('style');
    Array.from(element.children).forEach(child => removeStyles(child));
  }

  // 第一步：将所有非p标签的内容块转换为p标签
  function convertToParagraphs(element) {
    const children = Array.from(element.children);

    children.forEach(child => {
      if (child.tagName.toLowerCase() !== 'p') {
        // 如果是块级元素，将其转换为p
        if (getComputedStyle(child).display === 'block' ||
          ['div', 'ul', 'ol', 'li', 'section', 'article'].includes(child.tagName.toLowerCase())) {
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
    // 保存所有img标签
    const images = Array.from(p.getElementsByTagName('img'));

    // 替换<br>为特殊标记
    p.innerHTML = p.innerHTML.replace(/<br\s*\/?>/gi, '§LINEBREAK§');

    // 获取文本内容
    const text = p.textContent;

    // 清空当前内容
    while (p.firstChild) {
      p.removeChild(p.firstChild);
    }

    // 处理文本和换行
    const segments = text.split('§LINEBREAK§');
    segments.forEach((segment, index) => {
      if (segment) {
        p.appendChild(doc.createTextNode(segment));
      }
      // 在非最后一个分段后添加<br>
      if (index < segments.length - 1) {
        p.appendChild(doc.createElement('br'));
      }
    });

    // 重新添加图片
    images.forEach(img => {
      // 清除img的样式属性
      const cleanImg = img.cloneNode(true);
      cleanImg.removeAttribute('style');
      p.appendChild(cleanImg);
    });
  }

  // 移除所有样式
  removeStyles(container);

  // 转换标签
  convertToParagraphs(container);

  // 清理所有p标签
  const pElements = container.getElementsByTagName('p');
  Array.from(pElements).forEach(cleanParagraph);

  return container.outerHTML;
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "font_format") {
    const selectedElement = document.activeElement; // 获取当前激活的元素
    if (selectedElement) {
      console.log(selectedElement.outerHTML);
      selectedElement.outerHTML = cleanPTags(selectedElement.outerHTML);

    }
    return true; // 必须返回 true 来允许异步响应
   }
});
