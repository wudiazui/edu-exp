import u from "umbrellajs";

// Function to send events to update editor
function sendFixEvent(element) {
  // 发送变化事件
  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true}));
}

// 百川格式整理功能
async function formatOrganize(content) {
  // 移除空白的 <p> 标签
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');

  // 查找所有 p 标签
  const paragraphs = doc.querySelectorAll('p');
  paragraphs.forEach(p => {
    // 检查是否为空（只包含空格、换行等）
    if (!p.textContent.trim()) {
      p.remove();
    }
  });

  // 移除空白的列表项
  const listItems = doc.querySelectorAll('li[data-list="bullet"]');
  listItems.forEach(li => {
    // 检查是否只包含空的 ql-ui span
    const spans = li.querySelectorAll('span.ql-ui');
    if (spans.length === 1 && !li.textContent.trim()) {
      li.remove();
    }
  });

  // 移除文本内容中的空格，但保持HTML结构不变
  // 选择所有可能包含文本的元素，排除script、style等非可见元素
  const allElements = doc.querySelectorAll('*:not(script):not(style):not(noscript):not(template):not(head):not(meta):not(title):not(link)');
  allElements.forEach(element => {
    // 跳过空元素和只包含空白字符的元素
    if (!element.textContent || !element.textContent.trim()) {
      return;
    }
    
    // 跳过特定标签
    const tagName = element.tagName.toLowerCase();
    if (['script', 'style', 'noscript', 'template', 'head', 'meta', 'title', 'link'].includes(tagName)) {
      return;
    }
    
    // 使用TreeWalker来遍历所有文本节点，保持HTML结构
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // 只处理可见文本节点，跳过空白节点和script/style中的文本
          const parentTag = node.parentElement ? node.parentElement.tagName.toLowerCase() : '';
          if (['script', 'style', 'noscript', 'template'].includes(parentTag)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.textContent && node.textContent.trim()) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      },
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    // 仅处理文本节点中的空格，不影响HTML标签
    textNodes.forEach(textNode => {
      // 移除文本节点中的空格，但保留换行符
      textNode.textContent = textNode.textContent.replace(/[ \t\r\f\v]+/g, '');
    });
  });

  // 返回处理后的 HTML
  return doc.body.innerHTML;
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "fill_content") {
    // Helper function to fill editor content
    async function fillEditorContent(element) {
      if (!element) return false;

      // Find the ql-editor div inside this element
      const editorDiv = element.querySelector('.ql-editor');
      if (!editorDiv) return false;

      // Convert text to HTML safely
      const parser = new DOMParser();
      const doc = parser.parseFromString(request.text, 'text/html');
      const sanitizedContent = doc.body.innerHTML;

      // Insert the content
      if (request.append && editorDiv.innerHTML) {
        editorDiv.innerHTML += sanitizedContent;
      } else {
        editorDiv.innerHTML = sanitizedContent;
      }

      // Trigger change event to update the editor
      sendFixEvent(editorDiv);
      // 自动执行格式整理
      try {
        const formattedContent = await formatOrganize(editorDiv.innerHTML);
        editorDiv.innerHTML = formattedContent;
        sendFixEvent(editorDiv);
      } catch (error) {
        console.error('格式整理失败:', error);
      }

      return true;
    }
    console.log(request);

    // Find elements with the specified class using umbrellajs
    const elements = u('.ql-container.ql-tk-base.text-editor-wrapper.ql-tiku');
    // Take only the last 3 elements, discard the rest
    const allNodes = elements.nodes;
    const elementsCount = allNodes.length;
    const [elem1, elem2, elem3] = allNodes.slice(Math.max(0, elementsCount - 3));

    // 检查URL是否包含newAnswerTask
    const isNewAnswerTask = window.location.href.includes('newAnswerTask');

    if (request.type === "answer") {
      // 题目详解
      if (isNewAnswerTask) {
        // 新答题任务页面使用elem2作为题目详解
        await fillEditorContent(elem1);
      } else {
        // 非新答题任务页面使用elem2作为题目详解
        // 目前两种页面都使用相同的元素，但逻辑已准备好支持不同情况
        await fillEditorContent(elem2);
      }
    } else if (request.type === "analysis") {
      // 思路点拨
      if (isNewAnswerTask) {
        // 新答题任务页面使用elem1作为思路点拨
        await fillEditorContent(elem2);
      } else {
        // 非新答题任务页面使用elem1作为思路点拨
        // 目前两种页面都使用相同的元素，但逻辑已准备好支持不同情况
        await fillEditorContent(elem1);
      }
    } else if (request.type === "topic") {
      await fillEditorContent(elem3); // 答案
    }

    return true;
  }

  if (request.action === "format_organize") {
    // 获取当前激活的编辑器
    const activeElement = document.activeElement;
    if (activeElement) {
      const content = activeElement.innerHTML;
      const formattedContent = await formatOrganize(content);
      activeElement.innerHTML = formattedContent;
      sendFixEvent(activeElement);
    }

    sendResponse({ status: 'success' });
    return true;
  }
});
