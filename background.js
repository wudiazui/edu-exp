console.log('Hello from the background script!')

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "font-format",
    title: "字体格式化",
    contexts: ["all"] // 可选：all, page, selection, image, link, editable, video, audio
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "font-format") {
    chrome.tabs.sendMessage(tab.id, { action: "font_format" });
  }
});
