// Function to send events to update editor
function sendFixEvent(element) {
  // 发送变化事件
  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true}));
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fill_content") {
    // Helper function to fill editor content
    function fillEditorContent(containerSelector) {
      const container = document.querySelector(containerSelector);
      if (!container) return false;
      
      const textContainer = container.querySelector('.w-e-text-container');
      if (!textContainer) return false;
      
      const editorContainer = textContainer.querySelector('.w-e-text');
      if (!editorContainer) return false;

      // TODO: Implement the content filling functionality
      // This should:
      // 1. Process the incoming text (request.text)
      // 2. Handle append mode if request.append is true
      // 3. Insert the content into the editor
      // 4. Trigger necessary events to update the editor
      // 5. Optionally render math formulas if enabled

      return true;
    }
    console.log(request);

    if (request.type === "answer") {
      fillEditorContent('[id^="answer-edit-"]');
      // Also fill reference if it exists
      fillEditorContent('[id^="cankao-edit-"]');
    } else if (request.type === "analysis") {
      fillEditorContent('[id^="analyse-edit-"]');
    } else if (request.type === "topic") {
      fillEditorContent('[id^="stem-edit-"]');
    } else if (request.type === "documentassistant") {
      fillEditorContent('[id="documentassistant"]');
    }

    return true;
  }
});
