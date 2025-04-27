import u from "umbrellajs";

// Function to send events to update editor
function sendFixEvent(element) {
  // 发送变化事件
  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true}));
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fill_content") {
    // Helper function to fill editor content
    function fillEditorContent(element) {
      if (!element) return false;
      
      // Find the ql-editor div inside this element
      const editorDiv = element.querySelector('.ql-editor');
      if (!editorDiv) return false;
      
      // Insert the content
      if (request.append && editorDiv.innerHTML) {
        editorDiv.innerHTML += request.text.replace(/\n/g, '');
      } else {
        editorDiv.innerHTML = request.text.replace(/\n/g, '');
      }
      
      // Trigger change event to update the editor
      sendFixEvent(editorDiv);
      return true;
    }
    console.log(request);
    
    // Find elements with the specified class using umbrellajs
    const elements = u('.ql-container.ql-tk-base.text-editor-wrapper.ql-tiku');
    console.log('Found elements:', elements.nodes);
    
    // Take only the last 3 elements, discard the rest
    const allNodes = elements.nodes;
    const elementsCount = allNodes.length;
    const [elem1, elem2, elem3] = allNodes.slice(Math.max(0, elementsCount - 3));
    
    console.log('Last three elements:', { elem1, elem2, elem3 });
    
    if (request.type === "answer") {
      fillEditorContent(elem2); // 题目详解
    } else if (request.type === "analysis") {
      fillEditorContent(elem1); // 思路点拨
    } else if (request.type === "topic") {
      fillEditorContent(elem3); // 答案
    }

    return true;
  }
});
