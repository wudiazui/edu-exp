import {ocr_text, run_llm, getAuditTaskLabel, format_latex, topic_split, content_review} from "./lib.js";
import { tex2svg } from "./tex2svg.js";
import { renderMarkdownWithMath } from "./markdown-renderer.js";
// 使用动态导入，而不是静态导入
// import marked from "marked";

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

// 添加全局变量声明
let autoClaimingTimer = null;
let autoClaimingActive = false;
let currentSuccessfulClaims = 0; // 添加已成功认领的计数

// Custom rendering for markdown with math formulas
// Moved to markdown-renderer.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "baidu-edu-tools",
    title: "百度教育",
    contexts: ["all"]
  }, function() {
    // Create "百度" submenu
    chrome.contextMenus.create({
      id: "baidu-submenu",
      title: "百度",
      parentId: "baidu-edu-tools",
      contexts: ["all"]
    }, function() {
      // Move existing menu items under "百度" submenu
      chrome.contextMenus.create({
        id: "font-format",
        title: "字体格式化",
        parentId: "baidu-submenu",
        contexts: ["all"]
      });
      chrome.contextMenus.create({
        id: "align-equals",
        title: "等号对齐",
        parentId: "baidu-submenu",
        contexts: ["all"]
      });
      chrome.contextMenus.create({
        id: "copy-html",
        title: "复制HTML",
        parentId: "baidu-submenu",
        contexts: ["selection"]
      });
      chrome.contextMenus.create({
        id: "paste-html",
        title: "粘贴HTML",
        parentId: "baidu-submenu",
        contexts: ["all"]
      });
      chrome.contextMenus.create({
        id: "send-topic",
        title: "发送题干到侧边栏",
        parentId: "baidu-submenu",
        contexts: ["all"]
      });
      chrome.contextMenus.create({
        id: "format-math",
        title: "渲染数学公式",
        parentId: "baidu-submenu",
        contexts: ["all"]
      });
      chrome.contextMenus.create({
        id: "math-img",
        title: "渲染竖式计算",
        parentId: "baidu-submenu",
        contexts: ["selection"]
      });
      chrome.contextMenus.create({
        id: "auto-fill-blank",
        title: "自动填入答案",
        parentId: "baidu-submenu",
        contexts: ["selection"]
      });
      chrome.contextMenus.create({
        id: "auto-fill-options",
        title: "自动填入选项",
        parentId: "baidu-submenu",
        contexts: ["selection"]
      });
      chrome.contextMenus.create({
        id: "topic-split",
        title: "题目切割",
        parentId: "baidu-submenu",
        contexts: ["all"]
      });
    });

    // Create "百川" submenu
    chrome.contextMenus.create({
      id: "baichuan-submenu",
      title: "百川",
      parentId: "baidu-edu-tools",
      contexts: ["all"]
    }, function() {
      chrome.contextMenus.create({
        id: "format-organize",
        title: "整理格式",
        parentId: "baichuan-submenu",
        contexts: ["all"]
      });
    });

    // Create character insert menu under "百度" submenu
    createCharacterMenus();
  });
});

// Update createCharacterMenus function to use the new parent menu
function createCharacterMenus() {
  chrome.contextMenus.remove("character-insert", () => {
    chrome.contextMenus.create({
      id: "character-insert",
      title: "字符插入",
      parentId: "baidu-submenu",
      contexts: ["editable"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.log('Menu creation error:', chrome.runtime.lastError);
        return;
      }
      chrome.storage.sync.get(['shortcuts'], (result) => {
        if (result.shortcuts) {
          result.shortcuts.forEach(shortcut => {
            chrome.contextMenus.create({
              id: `insert-char-${shortcut.name}`,
              title: shortcut.name,
              parentId: "character-insert",
              contexts: ["editable"]
            });
          });
        }
      });
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "font-format") {
    chrome.tabs.sendMessage(tab.id, { action: "font_format" });
  }
  if (info.menuItemId === "align-equals") {
    chrome.tabs.sendMessage(tab.id, { action: "align_equals" });
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
  if (info.menuItemId === "math-img") {
    chrome.tabs.sendMessage(tab.id, { action: "math_img" });
  }
  if (info.menuItemId === "auto-fill-blank") {
    chrome.tabs.sendMessage(tab.id, { action: "auto_fill_blank" });
  }
  if (info.menuItemId === "auto-fill-options") {
    chrome.tabs.sendMessage(tab.id, { action: "auto_fill_options" });
  }
  if (info.menuItemId === "topic-split") {
    chrome.tabs.sendMessage(tab.id, { action: "topic_split" });
  }
  if (info.menuItemId === "format-organize") {
    chrome.tabs.sendMessage(tab.id, { action: "format_organize" });
  }
  if (info.menuItemId.startsWith('insert-char-')) {
    const shortcutName = info.menuItemId.replace('insert-char-', '');
    chrome.storage.sync.get(['shortcuts'], (result) => {
      if (result.shortcuts) {
        const shortcut = result.shortcuts.find(s => s.name === shortcutName);
        if (shortcut) {
          chrome.tabs.sendMessage(tab.id, {
            action: "insert_character",
            character: shortcut.character
          });
        }
      }
    });
  }
});

// 添加消息监听器来处理HTML的存储和获取
// 添加快捷键命令监听器
chrome.commands.onCommand.addListener((command) => {
  // 获取当前活动标签页
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      const tab = tabs[0];
      switch (command) {
      case 'font-format':
        chrome.tabs.sendMessage(tab.id, { action: "font_format" });
          break;
        case 'format-math':
          chrome.tabs.sendMessage(tab.id, { action: "format_math" });
          break;
        case 'math-img':
          chrome.tabs.sendMessage(tab.id, { action: "math_img" });
          break;
        case 'send-topic':
          chrome.tabs.sendMessage(tab.id, { action: "send_topic" });
          break;
      }
    }
  });
});

// 存储当前激活的审核端口连接
let activeAuditPort = null;

// 添加连接端口监听器
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'audit-task-label') {
    port.onMessage.addListener(async (message) => {
      if (message.type === 'GET_AUDIT_TASK_LABEL') {
        try {
          // 获取当前活动的标签页
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          // 发送消息到 content script 并等待响应
          const response = await chrome.tabs.sendMessage(activeTab.id, {
            type: 'GET_AUDIT_TASK_LABEL_RESPONSE',
            data: message.data,
            selectedTaskType: message.selectedTaskType
          });
          // 将内容脚本的响应发送回端口
          port.postMessage(response);
        } catch (error) {
          console.error('Error in audit task label handler:', error);
          port.postMessage({ errno: 1, errmsg: error.message });
        }
      }
    });
  }
  
  // 处理审核内容长连接
  if (port.name === 'audit-content-channel') {
    console.log('已建立审核内容长连接');
    // 保存当前活动的审核端口
    activeAuditPort = port;
    
    // 监听从侧边栏发来的消息
    port.onMessage.addListener((request) => {
      // 处理审核开始请求
      if (request.action === "start_audit_check") {
        // 获取当前活动标签页
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs && tabs[0]) {
            // 转发消息到内容脚本，明确指定主框架
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "start_audit_check"
            }, { frameId: 0 }, response => {
              // 若有直接响应，立即转发回侧边栏
              if (response) {
                port.postMessage({
                  action: "audit_content_result",
                  html: response.html
                });
              }
            });
          } else {
            // 如果没有找到活动标签页，返回错误
            port.postMessage({
              action: "audit_content_result",
              error: "未找到活动标签页"
            });
          }
        });
      }
      
      // 处理内容审核请求
      if (request.action === "start_content_review") {
        const { text, host, uname } = request;
        
        if (!text || !host || !uname) {
          port.postMessage({
            action: "content_review_error",
            error: "参数不完整，缺少文本内容或服务器信息"
          });
          return;
        }

        // 调用 content_review 函数处理内容并获取流式响应
        const controller = content_review(
          text,
          host,
          uname,
          // 消息处理器 - 将接收到的每个数据块转发给侧边栏
          (eventData) => {
            try {
              let data;
              try {
                data = JSON.parse(eventData);
              } catch {
                data = eventData;
              }
              
              port.postMessage({
                action: "content_review_message",
                data: data
              });
            } catch (error) {
              console.error("处理审核数据时出错:", error);
            }
          },
          // 错误处理器
          (error) => {
            console.error("内容审核出错:", error);
            port.postMessage({
              action: "content_review_error",
              error: error.message || "未知错误"
            });
          },
          // 完成处理器
          () => {
            port.postMessage({
              action: "content_review_complete"
            });
          }
        );
      }
    });
    
    // 监听连接断开
    port.onDisconnect.addListener(() => {
      console.log('审核内容长连接已断开');
      // 清除引用
      if (activeAuditPort === port) {
        activeAuditPort = null;
      }
    });
  }
});

// Add message listener for LaTeX rendering requests
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
    // 转发给 sidebar，并去除前后空白行
    chrome.runtime.sendMessage({
      type: 'SET_QUESTION',
      data: request.html.trim()
    });
  }
  
  // 处理Markdown和数学公式渲染请求
  if (request.action === "render_math_markdown") {
    try {
      // 使用try-catch包装异步渲染过程
      (async () => {
        try {
          const html = await renderMarkdownWithMath(request.markdown);
          sendResponse({ success: true, html });
        } catch (error) {
          console.error('渲染出错:', error);
          
          // 使用marked作为回退方案
          try {
            // 动态导入marked
            const { marked } = await import('marked');
            const fallbackHtml = marked(request.markdown);
            sendResponse({ 
              success: true, 
              html: fallbackHtml,
              warning: '使用了简化渲染，数学公式可能无法正确显示'
            });
          } catch (fallbackError) {
            console.error('Fallback渲染也失败:', fallbackError);
            sendResponse({ 
              success: false, 
              error: `${error.message}; Fallback也失败: ${fallbackError.message}`,
              html: `<pre>${request.markdown}</pre>`
            });
          }
        }
      })();
      
      // 返回true表示稍后会调用sendResponse
      return true;
    } catch (error) {
      console.error('处理渲染请求出错:', error);
      sendResponse({ 
        success: false, 
        error: error.message,
        html: `<pre>${request.markdown}</pre>`
      });
    }
  }
  
  // 处理题目切割消息，转发图片数据到侧边栏
  if (request.type === 'TOPIC_SPLIT' && request.data) {
    // 如果有图片数据，将其直接转发到TopicSplitComponent
    if (typeof request.data === 'object' && request.data.image_data) {
      chrome.runtime.sendMessage({
        type: 'TOPIC_SPLIT_IMAGE',
        data: request.data.image_data
      });
    } else {
      // 如果是文本数据，使用原有的topic_split处理
      formatMessage('TOPIC_SPLIT', request.data, request.host, request.uname);
    }
  }

  // 处理LaTeX渲染消息
  if (request.action === "render_math_formula") {
    try {
      console.log('渲染公式:', request.formula);
      // 调用 tex2svg 渲染公式
      const svgHtml = tex2svg(request.formula, request.isDisplay);
      console.log('渲染结果:', svgHtml.slice(0, 100) + '...');
      sendResponse({success: true, svgHtml});
    } catch (error) {
      console.error('渲染公式失败:', error);
      // 错误情况下返回错误提示
      sendResponse({
        success: false, 
        error: error.message,
        svgHtml: `<span class="math-error">公式渲染错误: ${request.formula}</span>`
      });
    }
    return true; // Indicates async response
  }

  // 处理format_latex消息
  if (request.action === "format_latex") {
    (async () => {
      try {
        // 从storage获取服务器配置
        const { host, name } = await new Promise(resolve => {
          chrome.storage.sync.get(['host', 'name'], resolve);
        });

        if (!host || !name) {
          throw new Error('未找到服务器配置');
        }

        // 调用format_latex函数处理文本
        const formatted = await format_latex(host, name, request.text);
        
        if (formatted) {
          sendResponse({ formatted });
        } else {
          throw new Error('格式化失败');
        }
      } catch (error) {
        console.error('Error formatting LaTeX:', error);
        sendResponse({ error: error.message || '未知错误' });
      }
    })();
    return true; // 保持消息通道开放以等待异步响应
  }

  // 处理认领任务响应的转发
  if (request.action === "claimAuditTaskResponse") {
    chrome.runtime.sendMessage({
      type: 'CLAIM_AUDIT_TASK_RESPONSE',
      data: request.data
    });
    return true;
  }

  // 处理自动认领的开始和停止
  if (request.action === "start_auto_claiming") {
    chrome.storage.local.get(['autoClaimingInterval'], (result) => {
      const interval = request.interval || (result.autoClaimingInterval * 1000) || 1000;
      autoClaimingActive = true;
      // 初始化已认领计数
      currentSuccessfulClaims = request.successfulClaims || 0;
      // 获取认领数量限制
      const claimLimit = request.claimLimit || 10;
      
      chrome.storage.local.set({
        autoClaimingActive: true,
        autoClaimingInterval: interval / 1000  // 保存为秒
      });

      if (autoClaimingTimer) {
        clearInterval(autoClaimingTimer);
        autoClaimingTimer = null;
      }

      console.log('[Background] Polling interval:', interval, 'ms');
      autoClaimingTimer = setInterval(() => {
        // 获取所有标签页
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            // 向每个标签页发送消息
            chrome.tabs.sendMessage(tab.id, {
              action: "periodic_message",
              message: "自动认领中",
              timestamp: new Date().toISOString(),
              params: request.params,
              includeKeywords: request.includeKeywords || [], // 传递包含关键词列表
              excludeKeywords: request.excludeKeywords || [],  // 传递排除关键词列表
              claimLimit: request.claimLimit || 10, // 传递认领数量限制，默认为10
              successfulClaims: currentSuccessfulClaims // 传递当前已认领数量
            });
          });
        });
      }, interval);

      sendResponse({ status: "started" });
    });
    return true;  // 保持消息通道开放
  }

  if (request.action === "stop_auto_claiming") {
    autoClaimingActive = false;
    chrome.storage.local.set({ autoClaimingActive: false });
    if (autoClaimingTimer) {
      clearInterval(autoClaimingTimer);
      autoClaimingTimer = null;
    }
    // 重置已认领计数
    currentSuccessfulClaims = 0;
    sendResponse({ status: "stopped" });
    return true;
  }
  
  // 处理更新认领计数的消息
  if (request.action === "update_claim_count") {
    currentSuccessfulClaims = request.successfulClaims;
    console.log('[Background] 更新已认领计数:', currentSuccessfulClaims);
    sendResponse({ status: "updated" });
    return true;
  }

  if (request.action === "get_auto_claiming_status") {
    sendResponse({ autoClaimingActive });
    return true;
  }

  // Handle fill answer/analysis messages
  if (request.type === "answer" || request.type === "analysis" || request.type === "topic" || request.type === "documentassistant") {
    // Forward the message to the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "fill_content",
          type: request.type,
          text: request.text,
          append: request.append // 中继 append 参数
        });
      }
    });
    return true;
  }

  const formatMessage = async (type, data, host, uname) => {
    try {
      let formatted;
      if (type === 'FORMAT_QUESTION') {
        formatted = await run_llm(host, uname, 'topic_format', data);
      } else if (type === 'TOPIC_ANSWER') {
        formatted = await run_llm(host, uname, 'topic_answer', data);
      } else if (type === 'TOPIC_ANALYSIS') {
        formatted = await run_llm(host, uname, 'topic_analysis', data)
      } else if (type === 'TOPIC_COMPLETE') {
        formatted = await run_llm(host, uname, 'topic_complete', data)
      } else if (type === 'OCR') {
        formatted = await ocr_text(data, host, uname);
      } else if (type === 'TOPIC_SPLIT') {
        formatted = await topic_split(data, host, uname);
      }
      sendResponse({ formatted });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  };

  if (['FORMAT_QUESTION', 'TOPIC_ANSWER', 'TOPIC_ANALYSIS', 'TOPIC_COMPLETE', 'OCR', 'TOPIC_SPLIT'].includes(request.type)) {
    formatMessage(request.type, request.data, request.host, request.uname);
    return true; // 保持消息通道开放以等待异步响应
  }

  // 添加消息监听器处理快捷键更新
  if (request.type === 'UPDATE_SHORTCUTS') {
    // 向所有标签页转发快捷键更新消息
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SHORTCUTS_UPDATED',
          shortcuts: request.shortcuts
        });
      });
    });
    // 更新右键菜单
    createCharacterMenus();
  }

  // 处理审核功能相关的消息转发
  if (request.action === "start_audit_check") {
    // 获取当前活动标签页
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs[0]) {
        // 转发消息到内容脚本, 明确指定主框架
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "start_audit_check"
        }, { frameId: 0 });
      } else {
        // 如果没有找到活动标签页，返回错误
        chrome.runtime.sendMessage({
          action: "audit_content_result",
          error: "未找到活动标签页"
        });
      }
    });
    return true;
  }

  // 从内容脚本接收消息并转发到扩展页面
  if (request.action === "audit_content_extract") {
    // 如果有活动的审核端口，通过端口发送
    if (activeAuditPort) {
      activeAuditPort.postMessage({
        action: "audit_content_extract",
        html: request.html,
        rawData: request.rawData,
        error: request.error
      });
    } else {
      // 如果没有活动端口，使用广播方式
      chrome.runtime.sendMessage({
        action: "audit_content_extract",
        html: request.html,
        rawData: request.rawData,
        error: request.error
      });
    }
    return true;
  }

  // 处理内容提取请求
  if (request.action === "extract_content") {
    // 获取当前活动标签页
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs[0]) {
        // 发送消息给内容脚本，请求提取页面内容
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "extract_page_content"
        });
      } else {
        // 如果没有找到活动标签页，返回错误
        chrome.runtime.sendMessage({
          action: "content_review_error",
          error: "未找到活动标签页"
        });
      }
    });
    return true;
  }

  // 处理从内容脚本接收的提取内容
  if (request.action === "extracted_page_content") {
    // 将提取的内容转发给扩展界面
    chrome.runtime.sendMessage({
      action: "extracted_content",
      content: request.content
    });
    return true;
  }

  // 处理内容审核请求
  if (request.action === "start_content_review") {
    const { text, host, uname } = request;
    
    if (!text || !host || !uname) {
      chrome.runtime.sendMessage({
        action: "content_review_error",
        error: "参数不完整，缺少文本内容或服务器信息"
      });
      return true;
    }

    // 调用 content_review 函数处理内容并获取流式响应
    const controller = content_review(
      text,
      host,
      uname,
      // 消息处理器 - 将接收到的每个数据块转发给扩展UI
      (eventData) => {
        try {
          let data;
          try {
            data = JSON.parse(eventData);
          } catch {
            data = eventData;
          }
          
          chrome.runtime.sendMessage({
            action: "content_review_message",
            data: data
          });
        } catch (error) {
          console.error("处理审核数据时出错:", error);
        }
      },
      // 错误处理器
      (error) => {
        console.error("内容审核出错:", error);
        chrome.runtime.sendMessage({
          action: "content_review_error",
          error: error.message || "未知错误"
        });
      },
      // 完成处理器
      () => {
        chrome.runtime.sendMessage({
          action: "content_review_complete"
        });
      }
    );
    
    // 储存控制器，以便在需要时可以中止请求
    // 注意：由于background脚本的生命周期，并不需要特意管理中止逻辑
    return true;
  }

  return false;
});

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.shortcuts) {
    // shortcuts 发生变化时重建菜单
    createCharacterMenus();
  }
});
