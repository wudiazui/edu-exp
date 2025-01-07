import {text_format, run_llm} from "./lib.js";

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
    chrome.contextMenus.create({
      id: "send-topic",
      title: "发送题干到侧边栏",
      parentId: "baidu-edu-tools",
      contexts: ["all"]
    });
    chrome.contextMenus.create({
      id: "format-math",
      title: "渲染数学公式",
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
  if (info.menuItemId === "send-topic") {
    chrome.tabs.sendMessage(tab.id, { action: "send_topic" });
  }
  if (info.menuItemId === "format-math") {
    chrome.tabs.sendMessage(tab.id, { action: "format_math" });
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
  if (request.action === "store_topic_html") {
    // 转发给 sidebar
    chrome.runtime.sendMessage({
      type: 'SET_QUESTION',
      data: request.html
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const formatMessage = async (type, data, host, uname) => {
    try {
      let formatted;
      if (type === 'FORMAT_QUESTION') {
        formatted = await run_llm(host, uname, 'topic_format', data);
      } else if (type === 'TOPIC_ANSWER') {
        formatted = await run_llm(host, uname, 'topic_answer', data);
      } else if (type === 'TOPIC_ANALYSIS') {
        formatted = await run_llm(host, uname, 'topic_analysis', data)
      } else if (type === 'TEXT_FORMAT') {
        formatted = await topic_formt(data, host, uname);
      }
      sendResponse({ formatted });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  };

  if (['FORMAT_QUESTION', 'TOPIC_ANSWER', 'TOPIC_ANALYSIS', 'TEXT_FORMAT'].includes(message.type)) {
    formatMessage(message.type, message.data, message.host, message.uname);
    return true; // 保持消息通道开放以等待异步响应
  }
});
