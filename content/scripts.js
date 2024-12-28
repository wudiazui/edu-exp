console.log('hello from content_scripts');


function cleanPTags(html) {
  // 创建一个DOM解析器
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 获取主容器
  const container = doc.body.firstElementChild;

  // 第一步：将所有非p标签的内容块转换为p标签
  function convertToParagraphs(element) {
    const children = Array.from(element.children);

    children.forEach(child => {
      if (child.tagName.toLowerCase() !== 'p') {
        // 如果是块级元素（如div, ul, li等），将其转换为p
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

  // 开始转换标签
  convertToParagraphs(container);

  // 第二步：清理所有p标签内容，保留文本和图片
  const pElements = container.getElementsByTagName('p');

  for (let p of pElements) {
    // 保存所有img标签
    const images = Array.from(p.getElementsByTagName('img'));

    // 获取所有文本内容
    const text = p.textContent;

    // 清空当前内容
    while (p.firstChild) {
      p.removeChild(p.firstChild);
    }

    // 添加文本
    p.textContent = text;

    // 重新添加图片
    images.forEach(img => {
      p.appendChild(img.cloneNode(true));
    });
  }

  return container.outerHTML;
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "font_format") {
    const selectedElement = document.activeElement; // 获取当前激活的元素
    if (selectedElement) {
      console.log(selectedElement.outerHTML);
      selectedElement.outerHTML = cleanPTags(selectedElement.outerHTML);
      sendResponse({ html: selectedElement.outerHTML });
    } else {
      sendResponse({ html: null });
    }
    return true; // 必须返回 true 来允许异步响应
  }
});
