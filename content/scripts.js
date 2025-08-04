// 动态导入全局CSS文件以启用Tailwind CSS和daisyUI
import("../css/main.css");

import { claimAuditTask, getAuditTaskList, getAuditTaskLabel, replaceLatexWithImages, replacePunctuation, img_upload, replaceLatexWithImagesInHtml, getMyAuditTaskList, processImage } from "../lib.js";
import {generateVerticalArithmeticImage} from "../src/index.js";
import { CozeService } from "../coze.js";
import u from "umbrellajs";

// 导入关键词过滤模块
import { loadKeywordsFromStorage, checkURLAndAddFilterUI, setupEventListeners, applyFilter, includeKeywords, excludeKeywords, filterState } from './filterModule.js';

// 导入通知模块
import { showNotification, hideNotification } from './notificationModule.js';

// 导入文本格式化模块
import { cleanPTags } from './textFormatModule.js';

// 导入工具函数
import { printCascaderInputValue, setAnswerInputValue, getSelectedRadioText, getAuditContentDetails, extractText, getFillInBlanksValues } from './domUtils.js';

// 导入审核内容提取模块
import { extractAuditContent } from './auditContentExtractor.js';

// 导入抽屉模块
import { checkURLAndAddDrawerButton } from './drawerModule.js';

// 初始化加载关键词
loadKeywordsFromStorage();

// 添加竖式计算的通知ID变量
let verticalArithmeticNotificationId = null;

console.log('hello from content_scripts');
// 添加一个变量来存储复制的HTML
let copiedHTML = '';

// 页面加载和URL变化时检查
window.addEventListener('load', () => {
  checkURLAndAddFilterUI();
  checkURLAndAddDrawerButton();
  setupEventListeners();
});
window.addEventListener('hashchange', () => {
  checkURLAndAddFilterUI();
  checkURLAndAddDrawerButton();
  setupEventListeners();
});

// 为支持现代框架（如Vue, React等）的URL变化添加监听

// 1. 监听History API的变化
let lastPathname = window.location.pathname;
let lastSearch = window.location.search;
let lastHash = window.location.hash;

// 重写history方法以捕获路由变化
const originalPushState = history.pushState;
history.pushState = function() {
  originalPushState.apply(this, arguments);
  handleRouteChange();
};

const originalReplaceState = history.replaceState;
history.replaceState = function() {
  originalReplaceState.apply(this, arguments);
  handleRouteChange();
};

// 处理popstate事件（浏览器前进/后退按钮）
window.addEventListener('popstate', handleRouteChange);

// 2. 使用MutationObserver监听DOM变化
// 许多框架在路由变化时会修改DOM结构
const routeObserver = new MutationObserver((mutations) => {
  // 检查URL是否变化
  if (window.location.pathname !== lastPathname ||
      window.location.search !== lastSearch ||
      window.location.hash !== lastHash) {
    handleRouteChange();
  }
});

// 开始观察document.body的子树变化
document.addEventListener('DOMContentLoaded', () => {
  routeObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// 3. 添加轮询机制作为后备方案
// 某些框架可能使用自定义路由系统
setInterval(() => {
  if (window.location.pathname !== lastPathname ||
      window.location.search !== lastSearch ||
      window.location.hash !== lastHash) {
    handleRouteChange();
  }
}, 1000); // 每秒检查一次

// 路由变化处理函数
function handleRouteChange() {
  lastPathname = window.location.pathname;
  lastSearch = window.location.search;
  lastHash = window.location.hash;

  // 检查URL并添加过滤UI
  checkURLAndAddFilterUI();

  // 检查URL并添加抽屉按钮
  checkURLAndAddDrawerButton();

  // 设置事件监听器
  setupEventListeners();
}

let host; // 声明 host 变量

// 从 Chrome 存储中同步读取 host 参数
chrome.storage.sync.get(['host'], (result) => {
  host = result.host; // 获取 host 值
});





function createEvent(eventName) {
  const event = new Event(eventName, { bubbles: true, cancelable: true });
  return event;
}

function sendFixEvent(element) {
  // 发送输入事件
  // element.dispatchEvent(new Event('input', { bubbles: true }));

  // 发送变化事件
  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true}));

  /*
  // 发送键盘输入事件（回车）
  const enterEvent = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13, // 兼容旧版浏览器
    charCode: 13,
    bubbles: true
  });
  element.dispatchEvent(enterEvent);
   */
}


// 对文本按等号对齐的函数
function alignTextByEquals(html) {
  // 创建一个临时容器来解析HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // 提取所有文本节点和它们的父元素
  const textNodesAndParents = [];

  function extractTextNodes(node, parent) {
    if (node.nodeType === Node.TEXT_NODE) {
      // 如果是文本节点且包含等号，则记录它和它的父元素
      if (node.textContent.includes('=')) {
        textNodesAndParents.push({ node, parent });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // 如果是元素节点，则递归处理其子节点
      for (let i = 0; i < node.childNodes.length; i++) {
        extractTextNodes(node.childNodes[i], node);
      }
    }
  }

  // 从临时容器开始提取文本节点
  extractTextNodes(temp, temp);

  // 如果没有找到包含等号的文本节点，则直接返回原始HTML
  if (textNodesAndParents.length === 0) {
    return html;
  }

  // 按父元素分组文本节点
  const groupedByParent = {};
  textNodesAndParents.forEach(({ node, parent }) => {
    // 使用父元素的标签名和类名作为键
    const parentKey = `${parent.tagName.toLowerCase()}-${parent.className}`;
    if (!groupedByParent[parentKey]) {
      groupedByParent[parentKey] = [];
    }
    groupedByParent[parentKey].push(node);
  });

  // 处理每组文本节点
  Object.keys(groupedByParent).forEach(parentKey => {
    const textNodes = groupedByParent[parentKey];
    const parent = textNodes[0].parentNode;

    // 收集所有文本行
    const lines = [];
    textNodes.forEach(node => {
      // 将文本按换行符分割成多行
      const nodeLines = node.textContent.split('\n');
      lines.push(...nodeLines);
    });

    // 过滤掉不包含等号的行
    const linesWithEquals = lines.filter(line => line.includes('='));

    // 如果没有包含等号的行，则跳过处理
    if (linesWithEquals.length === 0) {
      return;
    }

    // 创建一个临时的不可见元素来精确测量字符宽度
    const measureElement = document.createElement('span');
    measureElement.style.visibility = 'hidden';
    measureElement.style.position = 'absolute';
    measureElement.style.whiteSpace = 'pre';
    // 使用与父元素相同的字体样式
    const parentStyle = window.getComputedStyle(parent);
    measureElement.style.font = parentStyle.font;
    document.body.appendChild(measureElement);

    // 计算每行等号前文本的实际宽度
    const equalsPrefixWidths = [];
    linesWithEquals.forEach(line => {
      const equalsIndex = line.indexOf('=');
      const prefix = line.substring(0, equalsIndex);

      // 测量前缀文本的宽度
      measureElement.textContent = prefix;
      const prefixWidth = measureElement.getBoundingClientRect().width;
      equalsPrefixWidths.push(prefixWidth);
    });

    // 找出最大宽度
    const maxPrefixWidth = Math.max(...equalsPrefixWidths);

    // 测量单个空格的宽度
    measureElement.textContent = ' ';
    const spaceWidth = measureElement.getBoundingClientRect().width;

    // 测量不同类型的空格字符宽度
    const spaceChars = {
      ' ': ' ',                    // 普通空格
      'enSpace': '\u2002',         // en空格
      'emSpace': '\u2003',         // em空格
      'thinSpace': '\u2009',       // 窄空格
      'hairSpace': '\u200A',       // 极窄空格
      'noBreakSpace': '\u00A0',    // 不换行空格
      'ideographicSpace': '\u3000' // 表意文字空格（中文全角空格）
    };

    const spaceWidths = {};
    for (const [name, char] of Object.entries(spaceChars)) {
      measureElement.textContent = char;
      spaceWidths[name] = measureElement.getBoundingClientRect().width;
    }

    // 选择最适合的空格字符（优先选择宽度较小的，以便更精确控制）
    let bestSpaceChar = ' ';
    let bestSpaceWidth = spaceWidth;

    for (const [name, width] of Object.entries(spaceWidths)) {
      if (width > 0 && width < bestSpaceWidth) {
        bestSpaceChar = spaceChars[name];
        bestSpaceWidth = width;
      }
    }

    // 移除测量元素
    document.body.removeChild(measureElement);

    // 对每行进行对齐处理
    const alignedLines = lines.map((line, lineIndex) => {
      const equalsIndex = line.indexOf('=');

      if (equalsIndex === -1) {
        // 如果行中没有等号，则不做处理
        return line;
      }

      // 获取当前行在包含等号的行中的索引
      const equalsLineIndex = linesWithEquals.indexOf(line);

      // 获取当前行等号前缀的宽度
      const prefixWidth = equalsPrefixWidths[equalsLineIndex];

      // 计算需要添加的空格数，使用精确的宽度计算
      // 向上取整以确保对齐
      const widthDifference = maxPrefixWidth - prefixWidth;
      const spacesToAdd = Math.ceil(widthDifference / bestSpaceWidth);

      // 使用选定的Unicode空格字符添加空格
      const spaces = bestSpaceChar.repeat(spacesToAdd);

      // 返回对齐后的行（在行首添加空格）
      return spaces + line;
    });

    // 将对齐后的文本内容设置回原始节点
    const newText = alignedLines.join('\n');

    // 如果只有一个文本节点，直接替换其内容
    if (textNodes.length === 1) {
      textNodes[0].textContent = newText;
    } else {
      // 如果有多个文本节点，将它们合并为一个
      while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
      }
      parent.textContent = newText;
    }

    // 处理换行：将文本节点中的\n替换为<br>元素
    // 这一步需要在设置textContent后进行，因为我们需要先有纯文本内容
    const textNode = textNodes.length === 1 ? textNodes[0] : parent.firstChild;
    if (textNode && textNode.textContent.includes('\n')) {
      // 创建一个文档片段来存放处理后的内容
      const fragment = document.createDocumentFragment();

      // 按换行符分割文本
      const lines = textNode.textContent.split('\n');

      // 添加每一行，并在行之间添加<br>元素
      lines.forEach((line, index) => {
        fragment.appendChild(document.createTextNode(line));

        // 如果不是最后一行，添加<br>元素
        if (index < lines.length - 1) {
          fragment.appendChild(document.createElement('br'));
        }
      });

      // 替换原始文本节点
      if (textNodes.length === 1) {
        parent.replaceChild(fragment, textNodes[0]);
      } else {
        parent.replaceChild(fragment, parent.firstChild);
      }
    }
  });

  // 返回处理后的HTML
  return temp.innerHTML;
}

// 将字符转换为HTML实体的辅助函数
function convertToHtmlEntities(str) {
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    ' ': '&nbsp;',
    '\n': '<br>',
    '\t': '&nbsp;&nbsp;&nbsp;&nbsp;'
  };
  return str.split('').map(char => entities[char] || char).join('');
}

// 声明快捷键变量
let shortcuts = [];

// 加载快捷键设置
chrome.storage.sync.get(['shortcuts'], (result) => {
  if (result.shortcuts) {
    shortcuts = result.shortcuts;
  }
});

// 监听来自 background script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_AUDIT_TASK_LABEL_RESPONSE') {
    // 调用 getAuditTaskLabel 并返回结果
    getAuditTaskLabel(message.selectedTaskType)
      .then(response => {
        sendResponse(response);
      })
      .catch(error => {
        sendResponse({ errno: 1, errmsg: error.message });
      });
    return true; // 保持消息通道开放以支持异步响应
  }
  return true;
});


chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "font_format") {
    // 调用printCascaderInputValue函数并获取返回值
    const cascaderValue = printCascaderInputValue();

    // 从存储中读取强力格式化设置
    const strongFormattingEnabled = await new Promise((resolve) => {
      chrome.storage.sync.get(['strongFormatting'], (result) => {
        // 如果没有设置，默认为true
        resolve(result.strongFormatting !== undefined ? result.strongFormatting : true);
      });
    });

    const selectedElement = document.activeElement;
    if (selectedElement) {
      // 保存滚动位置
      const scrollTop = selectedElement.scrollTop;
      const scrollLeft = selectedElement.scrollLeft;

      // 保存选区位置
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;

      // 创建一个临时容器来解析清理后的HTML
      const temp = document.createElement('div');

      // 如果cascaderValue包含"英语"，则不执行replacePunctuation
      if (cascaderValue && cascaderValue.includes('英语')) {
        // 清理HTML，但不替换标点符号（第二个参数为false），根据设置决定是否移除样式
        temp.innerHTML = await cleanPTags(selectedElement.innerHTML, false, strongFormattingEnabled);
      } else {
        // 正常清理HTML，包括替换标点符号（默认参数为true），根据设置决定是否移除样式
        temp.innerHTML = await cleanPTags(selectedElement.innerHTML, true, strongFormattingEnabled);
      }
      const cleanedElement = temp.firstElementChild;

      // 复制原始元素的属性到清理后的元素
      //Array.from(selectedElement.attributes).forEach(attr => {
      //cleanedElement.setAttribute(attr.name, attr.value);
      //});

      // 使用 replaceWith 替换元素（保持引用）
      selectedElement.innerHTML=temp.innerHTML;
      sendFixEvent(selectedElement);

      // 恢复滚动位置
      cleanedElement.scrollTop = scrollTop;
      cleanedElement.scrollLeft = scrollLeft;

      // 重新聚焦到元素
      cleanedElement.focus();
    }
    return true;
 };

  if (request.action === "copy_html") {
    const selection = window.getSelection();
    console.log(selection);
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = document.createElement('div');
      container.appendChild(range.cloneContents());
      const fullHTML = container.innerHTML;
      chrome.runtime.sendMessage({
        action: "store_copied_html",
        html: fullHTML
      });
    }
    return true;
  }

  if (request.action === "paste_html") {
    // 从background script获取存储的HTML
    chrome.runtime.sendMessage({ action: "get_copied_html" }, response => {
      if (response.html) {
        // 获取当前活动元素
        const activeElement = document.activeElement;

        // 创建临时容器
        const temp = document.createElement('div');
        temp.innerHTML = response.html;

        // 将所有内容（包括文本节点）追加到活动元素中
        const fragment = document.createDocumentFragment();
        while (temp.firstChild) {
          fragment.appendChild(temp.firstChild);
        }

        activeElement.appendChild(fragment);
        sendFixEvent(activeElement);
      }
    });
    return true;
  }
  if (request.action === "send_topic") {
    const activeElement = document.activeElement;
    if (activeElement) {
      // 创建临时容器并复制内容
      const temp = document.createElement('div');
      temp.innerHTML = activeElement.innerHTML;

      // 提取文本内容 - 使用导入的extractText函数
      const cleanText = extractText(temp);

      // 发送到 background script
      chrome.runtime.sendMessage({
        action: "store_topic_html",
        html: cleanText
      });
    }
    return true;
  }

  if (request.action === "send_review_to_sidebar") {
    const formattedText = extractAuditContent();
    console.log('formattedText:', formattedText);
    chrome.runtime.sendMessage({
      action: "audit_content_extract",
      html: formattedText
    });
    return true;
  }

  if (request.action === "start_audit_check") {
    // 使用提取的函数获取审核内容
    const formattedText = extractAuditContent();
    console.log('formattedText:', formattedText);
    chrome.runtime.sendMessage({
      action: "audit_content_extract",
      html: formattedText
    });

    return true;
  }

  if (request.action === "format_math") {
    (async () => {
      try {
        const activeElement = document.activeElement;
        if (!activeElement) {
          // Show error notification
          showNotification('错误：未找到活动元素', 'error');
          sendResponse({ success: false, error: 'No active element found' });
          return;
        }

        // Show loading notification and start timing
        const startTime = performance.now();
        const notificationId = showNotification('正在渲染数学公式...', 'info', true);

        const temp = document.createElement('div');
        temp.innerHTML = activeElement.innerHTML;
        //const result = await replaceLatexWithImages(temp.innerHTML);
        const result = await replaceLatexWithImagesInHtml(temp.innerHTML);

        activeElement.innerHTML = result;
        sendFixEvent(activeElement);

        // Calculate duration and show success notification
        const duration = ((performance.now() - startTime) / 1000).toFixed(2);
        hideNotification(notificationId);
        showNotification(`数学公式渲染完成，耗时 ${duration} 秒`, 'success');
      } catch (error) {
        // Show error notification
        showNotification('数学公式渲染失败：' + error.message, 'error');
        console.error({ success: false, error: error.message });
      }
    })();

    return true; // 保持消息通道开启
  }

  if (request.action === "math_img") {
    handleMathImg();
    return true;
  }

  if (request.action === "auto_fill_blank") {
    handleAutoFillBlank();
    return true;
  }

  if (request.action === "auto_fill_options") {
    handleAutoFillOptions();
    return true;
  }

  if (request.action === "topic_split") {
    // 使用umbrellajs查找class="doc-clip-img"的元素
    const docClipImgElements = u('.doc-clip-img');

    if (docClipImgElements.length > 0) {
      // 显示处理中通知
      const notificationId = showNotification('正在处理题目内容...', 'info');

      // 创建临时容器并复制内容
      const temp = document.createElement('div');
      // 使用正确的方式获取元素内容 - first()返回DOM元素，不是umbrella实例
      const firstElement = docClipImgElements.nodes[0];
      temp.innerHTML = firstElement ? firstElement.innerHTML : '';

      // 查找所有图片元素，特别是处理blob URL
      const processActiveElement = async () => {
        try {
          // 查找所有图片元素
          const images = temp.querySelectorAll('img');
          let blobImage = null;
          let originalSize = 0;

          // 查找第一个有效的blob URL图片
          for (const img of images) {
            const src = img.getAttribute('src');
            if (src && src.startsWith('blob:')) {
              try {
                // 获取blob数据
                const response = await fetch(src);
                const blob = await response.blob();
                originalSize = blob.size;
                console.log('Original blob size:', originalSize, 'bytes');

                // 压缩图片并转换为base64
                const base64Data = await compressAndConvertToBase64(blob);
                console.log('Compressed image size:', base64Data.length, 'bytes');
                console.log('Compression ratio:', (base64Data.length / originalSize).toFixed(2));

                blobImage = base64Data;
                break; // 找到第一个有效的blob图片就停止
              } catch (error) {
                console.error('Error processing blob URL:', error);
              }
            }
          }

          // 压缩图片并转换为base64的函数
          async function compressAndConvertToBase64(blob, quality = 0.7, maxWidth = 1200) {
            return new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                // 计算新的尺寸，保持宽高比
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                  const ratio = maxWidth / width;
                  width = maxWidth;
                  height = Math.floor(height * ratio);
                }

                // 创建canvas并绘制调整大小后的图片
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // 将canvas转换为压缩后的base64字符串
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
              };
              img.onerror = reject;

              // 从blob创建一个临时URL
              const url = URL.createObjectURL(blob);
              img.src = url;

              // 使用后释放URL
              img.onload = function() {
                URL.revokeObjectURL(url);

                // 计算新的尺寸，保持宽高比
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                  const ratio = maxWidth / width;
                  width = maxWidth;
                  height = Math.floor(height * ratio);
                }

                // 创建canvas并绘制调整大小后的图片
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // 将canvas转换为压缩后的base64字符串
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
              };
            });
          }

          if (blobImage) {
            // 记录 blobImage 的大小
            console.log('blobImage size:', blobImage.length, 'bytes');

            // 发送到 background script，指定类型为 TOPIC_SPLIT
            chrome.runtime.sendMessage({
              type: 'TOPIC_SPLIT',
              data: { 'image_data': blobImage }
            });

            hideNotification(notificationId);
            showNotification('已发送图片到题目切割标签页', 'success');
          } else {
            hideNotification(notificationId);
            showNotification('未找到可处理的图片', 'error');
          }
        } catch (error) {
          console.error('Error in topic_split:', error);
          showNotification('处理题目内容失败: ' + error.message, 'error');
        }
      };

      // 执行异步处理
      processActiveElement();
    } else {
      showNotification('请先选择一个文本区域', 'error');
    }
    return true;
  }

  if (request.action === "image_white_background") {
    handleImageWhiteBackground(request.srcUrl);
    return true;
  }

  if (request.action === "periodic_message") {
    // 导入工具函数
    import('./utils.js').then(({ filterByKeywords }) => {
      // 首先获取第一页来了解总页数
      const firstPageParams = { ...request.params, pn: 1 };
      getAuditTaskList(firstPageParams).then((res) => {
        if (res.errno === 0 && res.data) {
          // 计算总页数
          const totalCount = res.data.total || 0;
          const pageSize = res.data.rn || 20;
          const totalPages = Math.ceil(totalCount / pageSize);
          
          // 随机选择一个页面（如果总页数大于1）
          let randomPage = 1;
          if (totalPages > 1) {
            randomPage = Math.floor(Math.random() * totalPages) + 1;
          }
          
          console.log(`总任务数: ${totalCount}, 总页数: ${totalPages}, 随机选择第 ${randomPage} 页`);
          
          // 获取随机页面的数据
          const randomPageParams = { ...request.params, pn: randomPage };
          return getAuditTaskList(randomPageParams);
        }
      }).then((res) => {
        if (res && res.errno === 0 && res.data) {
          // 显示获取到的任务列表数量
          console.log(`获取到的任务列表数量: ${res.data.list ? res.data.list.length : 0}`);
          // 获取包含和排除关键词列表
          const includeKeywords = request.includeKeywords || [];
          const excludeKeywords = request.excludeKeywords || [];
          // 使用工具函数实现关键词过滤
          // 过滤任务列表
          const filteredTasks = res.data.list.filter(task => {
            // 只匹配 task.brief 的内容
            const textToCheck = task.brief || '';

            // 使用filterByKeywords函数检查文本是否满足关键词条件
            return filterByKeywords(textToCheck, includeKeywords, excludeKeywords);
          });

          // TODO: 添加更详细的日志，记录哪些关键词匹配了哪些任务
          console.log(`过滤后的任务: ${filteredTasks.length}/${res.data.list.length}`);

          // 获取认领数量限制和已认领数量
          const claimLimit = request.claimLimit || 10;
          const successfulClaims = request.successfulClaims || 0;
          // 计算还需要认领的数量
          const remainingClaimsNeeded = Math.max(0, claimLimit - successfulClaims);
          // 如果已经达到认领上限，不再认领
          if (remainingClaimsNeeded <= 0) {
            console.log('已达到认领上限，不再认领');
            return;
          }

          // 只认领不超过remainingClaimsNeeded个题目
          let taskIdsToUse = [];
          // 无论任务数量多少，都限制为不超过remainingClaimsNeeded个
          const tasksToUse = filteredTasks.slice(0, remainingClaimsNeeded);
          taskIdsToUse = tasksToUse.map(task => request.params.taskType === 'producetask' ? task.clueID : task.taskID);
          console.log('将要认领的Task IDs:', taskIdsToUse);

          if (taskIdsToUse.length > 0) {
            const params = request.params.taskType === 'producetask'
              ? { clueIDs: taskIdsToUse }
              : { taskIds: taskIdsToUse };

            claimAuditTask(taskIdsToUse, request.params.taskType).then((res) => {
              console.log('Claim audit task response:', res);
              chrome.runtime.sendMessage({ action: 'claimAuditTaskResponse', data: res.data });
            }).catch((error) => {
              console.error('Error claiming audit task:', error);
            });
          }
        }
      });
    });
  }

  if (request.action === "align_equals") {
    (async () => {
      try {
        const activeElement = document.activeElement;
        if (!activeElement) {
          showNotification('错误：未找到活动元素', 'error');
          return;
        }

        // 保存滚动位置
        const scrollTop = activeElement.scrollTop;
        const scrollLeft = activeElement.scrollLeft;

        // 显示加载中通知
        const notificationId = showNotification('正在对齐等号...', 'info', true);

        // 获取选中的文本范围
        const selection = window.getSelection();
        let selectedText = '';

        if (selection.rangeCount > 0 && !selection.isCollapsed) {
          // 有选中的文本，只处理选中部分
          selectedText = selection.toString().trim();
        } else {
          // 没有选中文本，处理整个活动元素
          selectedText = activeElement.innerText.trim();
        }

        if (!selectedText) {
          throw new Error('没有找到要处理的文本');
        }

        // 从storage获取服务器配置
        const { host, name, serverType, kouziAccessKey, kouziAppId, kouziEquationAlignWorkflowId } = await new Promise(resolve => {
          chrome.storage.sync.get([
            'host',
            'name',
            'serverType',
            'kouziAccessKey',
            'kouziAppId',
            'kouziEquationAlignWorkflowId'
          ], resolve);
        });

        let formattedText;

        if (serverType === "扣子") {
          if (!kouziAccessKey || !kouziAppId || !kouziEquationAlignWorkflowId) {
            throw new Error('未找到扣子服务器配置');
          }

          try {
            // 使用CozeService调用扣子工作流
            const cozeService = new CozeService(kouziAccessKey);
            const result = await cozeService.executeWorkflow(kouziEquationAlignWorkflowId, {
              app_id: kouziAppId,
              parameters: {
                text: selectedText
              }
            });

            if (result && result.data) {
              try {
                const parsedData = JSON.parse(result.data);
                if (parsedData && parsedData.text) {
                  formattedText = parsedData.text;
                } else {
                  throw new Error('扣子工作流返回数据格式错误：缺少text字段');
                }
              } catch (parseError) {
                console.error('Parse error:', parseError);
                throw new Error('扣子工作流返回数据解析失败');
              }
            } else {
              throw new Error('扣子工作流返回格式错误');
            }
          } catch (error) {
            console.error('CozeService error:', error);
            throw new Error(`扣子服务调用失败: ${error.message}`);
          }
        } else {
          // 对于非扣子服务器，发送消息到background.js处理
          formattedText = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
              action: 'format_latex',
              text: selectedText
            }, response => {
              if (response && response.formatted) {
                resolve(response.formatted);
              } else if (response.error) {
                reject(new Error(response.error));
              } else {
                reject(new Error('格式化失败'));
              }
            });
          });
        }

        // 如果有选中的文本，替换选中的文本
        if (formattedText) {  // 添加检查确保 formattedText 有效
          if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(formattedText));
          } else {
            // 如果没有选中文本，替换整个活动元素的内容
            activeElement.innerHTML = formattedText;
          }

          // 触发事件更新编辑器
          sendFixEvent(activeElement);

          // 恢复滚动位置
          activeElement.scrollTop = scrollTop;
          activeElement.scrollLeft = scrollLeft;

          // 重新聚焦到元素
          activeElement.focus();

          // 隐藏加载中通知并显示成功通知
          hideNotification(notificationId);
          showNotification('等号对齐完成', 'success');
        } else {
          throw new Error('格式化结果为空');
        }
      } catch (error) {
        console.error('Error aligning equals:', error);
        showNotification('等号对齐失败：' + error.message, 'error');
      }
    })();
    return true;
  }

  // 处理字符插入消息
  if (request.action === 'insert_character') {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.isContentEditable || activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      if (activeElement.isContentEditable) {
        // 处理可编辑div
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        // 将所有特殊字符转换为HTML实体
        const convertedChar = convertToHtmlEntities(request.character);
        // 创建一个临时元素来插入HTML实体
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = convertedChar;
        const textNode = tempDiv.firstChild;
        range.insertNode(textNode);
        // 将光标移动到插入的字符后面
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // 处理input和textarea
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const text = activeElement.value;
        const newText = text.substring(0, start) + request.character + text.substring(end);
        activeElement.value = newText;
        activeElement.selectionStart = activeElement.selectionEnd = start + request.character.length;
      }
    }
    return true;
  }

  // 处理快捷键更新消息
  if (request.type === 'SHORTCUTS_UPDATED') {
    shortcuts = request.shortcuts;
    console.log('Shortcuts updated:', shortcuts);
    return true;
  }

  if (request.action === "fill_content") {
    // 调用printCascaderInputValue函数获取返回值
    const cascaderValue = printCascaderInputValue();

    // 当返回值中包含"数学"二字时才执行设置答案输入框值的函数
    if (cascaderValue && (cascaderValue.includes('数学') || cascaderValue.includes('化学') || cascaderValue.includes('物理') || cascaderValue.includes('生物'))) {
      setAnswerInputValue();
    }

    // Helper function to fill editor content
    function fillEditorContent(containerSelector) {
      const container = u(containerSelector);
      const textContainer = container.find('.w-e-text-container');
      const editorContainer = textContainer.find('.w-e-text');

      if (editorContainer.length) {
        const convertedText = request.text;
        const tempDiv = document.createElement('div');
        // Split text by newlines and wrap each line in p tags
        // Preserve spaces by converting them to HTML non-breaking spaces
        tempDiv.innerHTML = convertedText.split('\n')
          .map(line => {
            // Convert regular spaces to HTML non-breaking spaces
            //const lineWithPreservedSpaces = line.replace(/ /g, '&nbsp;');
            //return `<p>${lineWithPreservedSpaces}</p>`;
            return `<p>${line}</p>`
          })
          .join('');

        // 检查是否为追加模式，默认为替换模式
        const isAppend = request.append === true;

        if (isAppend) {
          // 追加模式：保留原有内容，添加新内容
          const currentContent = editorContainer.html();
          editorContainer.html(currentContent + tempDiv.innerHTML);
        } else {
          // 替换模式：直接替换全部内容
          editorContainer.html(tempDiv.innerHTML);
        }

        sendFixEvent(editorContainer.first());  // 使用 .first() 获取第一个原生 DOM 元素

        // 渲染数学公式
        (async () => {
          try {
            // 先检查是否启用了自动渲染
            const result = await new Promise(resolve => {
              chrome.storage.sync.get(['autoRenderFormula'], resolve);
            });

            // 如果未启用自动渲染，直接返回
            if (!result.autoRenderFormula) {
              return;
            }

            // Show loading notification
            const notificationId = showNotification('正在渲染数学公式...', 'info', true);

            // Render math formulas
            const renderedHtml = await replaceLatexWithImagesInHtml(editorContainer.html());
            editorContainer.html(renderedHtml);

            // Trigger editor events to update - get the native DOM element
            sendFixEvent(editorContainer.first());  // 使用 .first() 获取第一个原生 DOM 元素

            // Hide loading notification and show success
            hideNotification(notificationId);
            showNotification('数学公式渲染完成', 'success');
          } catch (error) {
            showNotification('数学公式渲染失败：' + error.message, 'error');
            console.error('Math rendering error:', error);
          }
        })();

        return true;
      }
      return false;
    }

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
  }

  // 处理页面内容提取请求
  if (request.action === "extract_page_content") {
    try {
      // 获取页面的可见文本内容
      const bodyText = document.body.innerText || '';

      // 提取标题
      const title = document.title || '';

      // 提取元描述（如果有）
      let metaDescription = '';
      const metaDescTag = document.querySelector('meta[name="description"]');
      if (metaDescTag) {
        metaDescription = metaDescTag.getAttribute('content') || '';
      }

      // 提取主要内容区域（尝试找到主要内容区域，如果无法确定，则使用body）
      let mainContent = '';
      const possibleMainElements = [
        document.querySelector('main'),
        document.querySelector('article'),
        document.querySelector('#content'),
        document.querySelector('.content'),
        document.querySelector('#main'),
        document.querySelector('.main')
      ].filter(Boolean); // 过滤掉null和undefined

      if (possibleMainElements.length > 0) {
        // 使用最长的内容作为主要内容
        mainContent = possibleMainElements
          .map(element => element.innerText || '')
          .reduce((longest, current) =>
            current.length > longest.length ? current : longest, '');
      }

      // 组合提取的内容
      const extractedContent = `标题: ${title}\n\n` +
                               (metaDescription ? `描述: ${metaDescription}\n\n` : '') +
                               `内容:\n${mainContent || bodyText}`;

      // 发送提取的内容回背景脚本
      chrome.runtime.sendMessage({
        action: "extracted_page_content",
        content: extractedContent
      });
    } catch (error) {
      console.error('内容提取错误:', error);
      // 发送错误消息回背景脚本
      chrome.runtime.sendMessage({
        action: "extracted_page_content",
        error: error.message || '内容提取失败',
        content: '无法提取页面内容: ' + (error.message || '未知错误')
      });
    }
    return true;
  }

  if (request.action === "extract_editor_content") {
    try {
      // 使用提取的函数获取审核内容
      const formattedText = extractAuditContent();

      // 发送提取的编辑器内容回背景脚本
      chrome.runtime.sendMessage({
        action: "extracted_editor_content",
        content: formattedText
      });
    } catch (error) {
      console.error('编辑器内容提取错误:', error);
      // 发送错误消息回背景脚本
      chrome.runtime.sendMessage({
        action: "extracted_editor_content",
        error: error.message || '内容提取失败',
        content: ''
      });
    }
    return true;
  }
});

// 监听键盘事件
document.addEventListener('keydown', (e) => {
  // 构建当前按下的快捷键组合
  const keys = [];
  if (e.ctrlKey) keys.push('Ctrl');
  if (e.shiftKey) keys.push('Shift');
  if (e.altKey) keys.push('Alt');
  if (e.key && e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt') {
    keys.push(e.key.toUpperCase());
  }
  const pressedShortcut = keys.join('+');

  // 查找匹配的快捷键
  const matchedShortcut = shortcuts.find(s => s.keyboardShortcut === pressedShortcut);

  if (matchedShortcut) {
    e.preventDefault(); // 阻止默认行为

    // 触发字符插入
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.isContentEditable || activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      if (activeElement.isContentEditable) {
        // 处理可编辑div
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        // 将所有特殊字符转换为HTML实体
        const convertedChar = convertToHtmlEntities(matchedShortcut.character);
        // 创建一个临时元素来插入HTML实体
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = convertedChar;
        const textNode = tempDiv.firstChild;
        range.insertNode(textNode);
        // 将光标移动到插入的字符后面
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // 处理input和textarea
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const text = activeElement.value;
        const newText = text.substring(0, start) + matchedShortcut.character + text.substring(end);
        activeElement.value = newText;
        activeElement.selectionStart = activeElement.selectionEnd = start + matchedShortcut.character.length;
      }
    }
  }
});

async function handleMathImg() {
  try {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString().trim();

      // 显示加载中通知
      verticalArithmeticNotificationId = showNotification('正在生成竖式计算...', 'info', true);

      const imageBlob = await generateVerticalArithmeticImage(selectedText);

      // 隐藏加载中通知
      hideNotification(verticalArithmeticNotificationId);

      // 显示成功通知
      showNotification('竖式计算生成成功', 'success');

      // 显示上传中通知
      const uploadNotificationId = showNotification('正在上传竖式计算图片...', 'info', true);

      // Upload the image and get the response
      const uploadResponse = await img_upload(imageBlob);

      // 隐藏上传中通知
      hideNotification(uploadNotificationId);

      // 显示上传成功通知
      showNotification('竖式计算图片上传成功', 'success');

      // Create img element with the uploaded image URL
      const img = document.createElement('img');
      img.src = uploadResponse.data.cdnUrl;

      // Find the current line's parent element (likely a <p> tag)
      let currentBlock = range.startContainer;
      while (currentBlock && currentBlock.nodeType !== Node.ELEMENT_NODE) {
        currentBlock = currentBlock.parentNode;
      }

      // Create a new paragraph for the image
      const newP = document.createElement('p');
      newP.appendChild(img);

      // Insert the new paragraph after the current block
      if (currentBlock && currentBlock.parentNode) {
        currentBlock.parentNode.insertBefore(newP, currentBlock.nextSibling);
      }

      // Trigger events to update the editor
      sendFixEvent(document.activeElement);
    }
  } catch (error) {
    console.error('Error processing math image:', error);

    // 如果有加载中通知，先隐藏
    if (verticalArithmeticNotificationId) {
      hideNotification(verticalArithmeticNotificationId);
      verticalArithmeticNotificationId = null;
    }

    // 确定错误类型并显示相应的错误消息
    let errorMessage = '未知错误';
    if (error.message) {
      errorMessage = error.message;

      // 根据错误消息判断错误类型
      if (error.message.includes('upload') || error.message.includes('网络')) {
        errorMessage = '图片上传失败: ' + error.message;
      } else if (error.message.includes('parse') || error.message.includes('syntax')) {
        errorMessage = '表达式格式错误: ' + error.message;
      } else if (error.message.includes('render') || error.message.includes('canvas')) {
        errorMessage = '渲染计算过程失败: ' + error.message;
      }
    }

    // 显示错误通知
    showNotification('竖式计算处理失败: ' + errorMessage, 'error');
  }
}

async function handleImageWhiteBackground(srcUrl) {
  try {
    // 显示处理中通知
    const notificationId = showNotification('正在处理图片白底...', 'info', true);

    // 获取图片并转换为base64
    const response = await fetch(srcUrl);
    const blob = await response.blob();
    
    // 将blob转换为base64
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // 调用图片处理函数
    const processedBlob = await processImage(base64Data);

    // 隐藏处理中通知
    hideNotification(notificationId);

    // 显示上传中通知
    const uploadNotificationId = showNotification('正在上传处理后的图片...', 'info', true);

    // 上传处理后的图片
    const uploadResponse = await img_upload(processedBlob);

    // 隐藏上传中通知
    hideNotification(uploadNotificationId);

    // 找到页面中所有使用原始URL的图片元素并替换
    const imgElements = document.querySelectorAll('img');
    let replacedCount = 0;
    
    imgElements.forEach(img => {
      if (img.src === srcUrl) {
        img.src = uploadResponse.data.cdnUrl;
        replacedCount++;
      }
    });

    // 显示成功通知
    showNotification(`图片白底处理完成，已替换 ${replacedCount} 个图片`, 'success');

  } catch (error) {
    console.error('Error processing image white background:', error);
    
    // 隐藏所有通知
    hideNotification();
    
    // 显示错误通知
    let errorMessage = '未知错误';
    if (error.message) {
      errorMessage = error.message;
    }
    
    showNotification('图片白底处理失败: ' + errorMessage, 'error');
  }
}

async function handleAutoFillBlank() {
  const selectedText = window.getSelection().toString().trim();

  if (!selectedText) {
    showNotification('请先选择要填入的文本', 'error');
    return;
  }

  // 使用分号分割文本
  const answers = selectedText.split('；').filter(text => text.trim());

  // 首先找到所有 c-margin-bottom-middle el-row 容器
  const containers = u('.c-margin-bottom-middle.el-row');
  if (!containers.length) {
    showNotification('未找到填空答案区域', 'error');
    return;
  }

  // 遍历每个容器并处理其中的输入框
  for (let i = 0; i < Math.min(containers.length, answers.length); i++) {
    const container = u(containers.nodes[i]);
    const inputElement = container.find('.el-input__inner');

    if (inputElement.length > 0) {
      const input = inputElement.nodes[0];

      // 设置输入值
      input.value = answers[i].trim();

      // 触发输入事件
      const inputEvent = new Event('input', { bubbles: true });
      input.dispatchEvent(inputEvent);

      // 触发change事件
      const changeEvent = new Event('change', { bubbles: true });
      input.dispatchEvent(changeEvent);

      // 添加焦点和失焦事件以确保值被正确更新
      const focusEvent = new Event('focus', { bubbles: true });
      const blurEvent = new Event('blur', { bubbles: true });
      input.dispatchEvent(focusEvent);
      input.dispatchEvent(blurEvent);
    }
  }

  // 如果答案数量大于容器数量，需要添加新的输入框
  const diffCount = answers.length - containers.length;

  if (diffCount > 0) {
    const addBtn = u('.add-btn');
    if (addBtn.length > 0) {
      for (let i = 0; i < diffCount; i++) {
        addBtn.nodes[0].click();
        // 添加小延迟确保DOM更新
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 等待DOM更新后填入剩余答案
      await new Promise(resolve => setTimeout(resolve, 200));

      // 重新获取所有容器
      const newContainers = u('.c-margin-bottom-middle.el-row');

      // 填入剩余答案
      for (let i = containers.length; i < answers.length; i++) {
        if (i < newContainers.length) {
          const container = u(newContainers.nodes[i]);
          const inputElement = container.find('.el-input__inner');

          if (inputElement.length > 0) {
            const input = inputElement.nodes[0];

            // 设置输入值
            input.value = answers[i].trim();

            // 触发事件
            const inputEvent = new Event('input', { bubbles: true });
            const changeEvent = new Event('change', { bubbles: true });
            const focusEvent = new Event('focus', { bubbles: true });
            const blurEvent = new Event('blur', { bubbles: true });

            input.dispatchEvent(inputEvent);
            input.dispatchEvent(changeEvent);
            input.dispatchEvent(focusEvent);
            input.dispatchEvent(blurEvent);
          }
        }
      }
    }
  }

  showNotification(`已成功填入 ${Math.min(answers.length, containers.length + diffCount)} 个答案`, 'success');
}

/**
 * 处理自动填入选项功能
 * 根据选中的文本，自动选择对应的选项
 */
async function handleAutoFillOptions() {
  const selectedText = window.getSelection().toString().trim();

  if (!selectedText) {
    showNotification('请先选择要填入的文本', 'error');
    return;
  }

  // 按照换行符分割文本，获取选项列表
  const options = selectedText.split('\n')
    .filter(text => text.trim())
    // 使用正则表达式移除选项前的标识符（如A.、B.、1.、(1)等）
    .map(text => text.trim().replace(/^\s*(?:[A-Za-z0-9]+[.、)\]\s]*|\([A-Za-z0-9]+[.、)\]\s]*|（[A-Za-z0-9]+[.、)\]\s]*|[\(\[【「『]?[A-Za-z0-9]+[.、)\]】」』\s]*)/u, '').trim());

  if (options.length === 0) {
    showNotification('未找到有效的选项内容', 'error');
    return;
  }

  try {
    // 按照指定的DOM路径查找按钮
    // 1. 找到 class=el-main 的div
    const mainDiv = u('.el-main');
    if (!mainDiv.length) {
      showNotification('未找到主内容区域(.el-main)', 'error');
      return;
    }

    // 2. 找到 class=c-margin-bottom-large 的div
    const largeMarginDivs = mainDiv.find('.c-margin-bottom-large');
    if (largeMarginDivs.length < 5) {
      showNotification(`未找到足够的内容区块(.c-margin-bottom-large), 当前数量: ${largeMarginDivs.length}`, 'error');
      return;
    }

    const targetLargeDiv = u(largeMarginDivs.nodes[4]); // 第四个div

    // 3. 找到 class=c-margin-bottom-middle el-row 的第一个div
    const middleMarginDivs = targetLargeDiv.find('.c-margin-bottom-middle.el-row');
    if (!middleMarginDivs.length) {
      showNotification('未找到选项区域(.c-margin-bottom-middle.el-row)', 'error');
      return;
    }
    const targetMiddleDiv = u(middleMarginDivs.nodes[0]); // 第一个div

    // 4. 找到 class=el-button el-button--primary el-button--small 的button
    const addButton = targetMiddleDiv.find('.el-button.el-button--primary.el-button--small');
    if (!addButton.length) {
      // 尝试查找其他可能的按钮选择器
      const allButtons = targetMiddleDiv.find('button');

      showNotification('未找到添加按钮', 'error');
      return;
    }

    // 先点击所有按钮，然后再插入文本

    // 定义一个函数来递归点击按钮，确保按钮点击完成后再执行插入操作
    function clickButtonsSequentially(index, callback) {
      if (index >= options.length) {
        callback();
        return;
      }

      // 模拟点击按钮
      addButton.nodes[0].click();

      // 等待一小段时间再点击下一个按钮，确保DOM有时间更新
      setTimeout(() => {
        clickButtonsSequentially(index + 1, callback);
      }, 100); // 每次点击间隔100ms
    }

    // 开始递归点击按钮
    showNotification(`正在添加 ${options.length} 个选项...`, 'info');
    clickButtonsSequentially(0, () => {
      // 所有按钮点击完成后执行的回调函数

      // 等待一小段时间，等DOM完全更新后再查找新的编辑器
      setTimeout(() => {
      // 在targetLargeDiv中查找.w-e-text-container元素
      const textContainers = targetLargeDiv.find('.w-e-text-container');

      if (textContainers.length === 0) {
        showNotification('未找到文本输入容器，请检查页面结构', 'error');
        return;
      }

      // 在每个.w-e-text-container中查找.w-e-text元素
      const textElements = [];
      textContainers.each((container) => {
        const textEl = u(container).find('.w-e-text');
        if (textEl.length) {
          textElements.push(textEl.nodes[0]);
        }
      });


      if (textElements.length === 0) {
        showNotification('未找到文本输入框，请检查页面结构', 'error');
        return;
      }

      // 将选项内容插入到对应的编辑器中
      let insertCount = 0;
      for (let i = 0; i < Math.min(options.length, textElements.length); i++) {
        const textElement = textElements[i];
        const optionText = options[i].trim();

        // 将选项内容设置到编辑器中
        textElement.innerHTML = optionText;

        insertCount++;
      }

      showNotification(`已成功填入 ${insertCount} 个选项内容`, 'success');
    }, 500); // 等待500毫秒给DOM更新的时间
    });


  } catch (error) {
    console.error('自动填入选项时出错:', error);
    showNotification(`自动填入选项失败: ${error.message}`, 'error');
  }
}

// 将API函数添加到全局作用域，供其他模块使用
window.getMyAuditTaskList = getMyAuditTaskList;
window.getAuditTaskList = getAuditTaskList;
window.getAuditTaskLabel = getAuditTaskLabel;
window.claimAuditTask = claimAuditTask;

console.log('✅ API函数已添加到全局作用域');
