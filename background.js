console.log('Hello from the background script!')

const isFirefoxLike =
  process.env.EXTENSION_PUBLIC_BROWSER === 'firefox' ||
    process.env.EXTENSION_PUBLIC_BROWSER === 'gecko-based'

if (isFirefoxLike) {
  browser.browserAction.onClicked.addListener(() => {
    browser.sidebarAction.open()
  })
} else {
  chrome.action.onClicked.addListener(() => {
    chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true})
  })
}

// 添加一个变量来存储复制的HTML
let storedHTML = '';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "baidu-edu-tools",
    title: "百度教育",
    contexts: ["all"] // 可选：all, page, selection, image, link, editable, video, audio
  }, function() {
    chrome.contextMenus.create({
      id: "font-format",
      title: "字体格式化",
      parentId: "baidu-edu-tools",
      contexts: ["all"]
    });
    chrome.contextMenus.create({
      id: "copy-html",
      title: "复制HTML",
      parentId: "baidu-edu-tools",
      contexts: ["selection"]
    });
    chrome.contextMenus.create({
      id: "paste-html",
      title: "粘贴HTML",
      parentId: "baidu-edu-tools",
      contexts: ["all"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "font-format") {
    chrome.tabs.sendMessage(tab.id, { action: "font_format" });
  }
  if (info.menuItemId === "copy-html") {
    chrome.tabs.sendMessage(tab.id, { action: "copy_html" });
  }
  if (info.menuItemId === "paste-html") {
    chrome.tabs.sendMessage(tab.id, { action: "paste_html" });
  }
});

// 添加消息监听器来处理HTML的存储和获取
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "store_copied_html") {
    storedHTML = request.html;
    return true;
  }
  if (request.action === "get_copied_html") {
    sendResponse({ html: storedHTML });
    return true;
  }
});
