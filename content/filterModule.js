// filterModule.js - 关键词过滤功能模块
import { filterByKeywords } from './utils.js';
import u from "umbrellajs";
import { showNotification } from "./notificationModule.js";

// 存储关键词过滤数据
let includeKeywords = [];
let excludeKeywords = [];

// 过滤状态
let filterState = {
  enabled: false, // 是否开启过滤
  active: false   // 是否应用过滤
};

// 从 Chrome 存储中加载关键词过滤数据
function loadKeywordsFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['includeKeywords', 'excludeKeywords'], (result) => {
      if (result.includeKeywords) {
        includeKeywords = result.includeKeywords;
      }
      if (result.excludeKeywords) {
        excludeKeywords = result.excludeKeywords;
      }
      resolve({ includeKeywords, excludeKeywords });
    });
  });
}

// 检查URL并添加过滤UI的函数
function checkURLAndAddFilterUI() {
  const currentURL = window.location.href;
  
  // 检查URL是否以 edu-shop-web/#/question-task/lead-pool 结尾
  // 使用正则表达式确保精确匹配路径末尾
  if (currentURL.match(/\/edu-shop-web\/#\/question-task\/lead-pool(?:[?#].*)?$/) || 
      currentURL.endsWith('/edu-shop-web/#/question-task/lead-pool') ||
      currentURL.match(/\/edu-shop-web\/#\/question-task\/audit-pool(?:[?#].*)?$/) ||
      currentURL.endsWith('/edu-shop-web/#/question-task/audit-pool')) {
    
    // 检查是否已经添加过过滤UI
    if (!document.getElementById('keyword-filter-container')) {
      // 确保关键词已从存储中加载
      loadKeywordsFromStorage().then(() => {
        // 等待过滤框元素加载
        const checkFilterBox = setInterval(() => {
          const filterBox = document.querySelector('.filter-box-compo');
          if (filterBox) {
            clearInterval(checkFilterBox);
            addFilterUI(filterBox);
          }
        }, 500);
      });
    }
  } else {
    // 如果URL不匹配，但过滤UI已存在，则移除它
    const filterContainer = document.getElementById('keyword-filter-container');
    if (filterContainer) {
      filterContainer.remove();
    }
  }
}

// 添加过滤UI
function addFilterUI(filterBox) {
  // 创建容器
  const container = document.createElement('div');
  container.id = 'keyword-filter-container';
  container.className = 'filter-container';
  // 添加上下边距，使UI与周围组件有间隔
  container.style.marginTop = '1px';
  container.style.marginBottom = '1px';
  container.style.paddingTop = '1px';
  container.style.paddingBottom = '3px';
  
  // 创建一个flex容器来放置所有元素在同一行
  const flexContainer = document.createElement('div');
  flexContainer.className = 'flex-container';
  container.appendChild(flexContainer);
  
  // 创建左侧输入区域容器
  const inputsContainer = document.createElement('div');
  inputsContainer.className = 'inputs-container';
  flexContainer.appendChild(inputsContainer);
  
  // 创建包含关键词输入区域
  const includeContainer = createInputGroup('包含关键词', 'include-keywords-input', 'include-keywords-list', includeKeywords);
  inputsContainer.appendChild(includeContainer);
  
  // 创建排除关键词输入区域
  const excludeContainer = createInputGroup('排除关键词', 'exclude-keywords-input', 'exclude-keywords-list', excludeKeywords);
  inputsContainer.appendChild(excludeContainer);
  
  // 创建按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.style.padding = '8px 12px';
  flexContainer.appendChild(buttonContainer);
  
  // 创建搜索按钮
  const filterBtn = document.createElement('button');
  filterBtn.textContent = '应用过滤';
  filterBtn.className = 'filter-button';
  filterBtn.onclick = () => applyFilter('apply');
  buttonContainer.appendChild(filterBtn);
  
  // 创建关闭过滤按钮
  const closeFilterBtn = document.createElement('button');
  closeFilterBtn.textContent = '关闭过滤';
  closeFilterBtn.className = 'close-filter-button';
  closeFilterBtn.onclick = function() {
    // 关闭过滤但保留关键词
    filterState.active = false;
    applyFilter();
  };
  buttonContainer.appendChild(closeFilterBtn);
  
  // 创建重置按钮
  const resetBtn = document.createElement('button');
  resetBtn.textContent = '重置';
  resetBtn.className = 'reset-button';
  resetBtn.onclick = function() {
    // 清空关键词
    includeKeywords = [];
    excludeKeywords = [];
    
    // 清空 UI
    document.getElementById('include-keywords-list').innerHTML = '';
    document.getElementById('exclude-keywords-list').innerHTML = '';
    
    // 清空输入框
    document.getElementById('include-keywords-input').value = '';
    document.getElementById('exclude-keywords-input').value = '';
    
    // 保存到 Chrome 存储
    saveKeywordsToStorage();
    
    // 重新应用过滤，显示所有行
    applyFilter();
  };
  buttonContainer.appendChild(resetBtn);
  
  // 插入到过滤框后面
  filterBox.parentNode.insertBefore(container, filterBox.nextSibling);
  
  // 初始化事件监听
  initKeywordEvents();
}

// 创建输入组
function createInputGroup(label, inputId, listId, keywordsArray) {
  const groupContainer = document.createElement('div');
  groupContainer.className = 'input-group';
  
  // 标签
  const labelElem = document.createElement('label');
  labelElem.textContent = label + ':';
  labelElem.className = 'input-label';
  labelElem.htmlFor = inputId;
  groupContainer.appendChild(labelElem);
  
  // 创建关键词和输入区域的容器
  const keywordInputContainer = document.createElement('div');
  keywordInputContainer.style.display = 'flex';
  keywordInputContainer.style.alignItems = 'center';
  keywordInputContainer.style.flexWrap = 'wrap';
  keywordInputContainer.style.gap = '4px';
  groupContainer.appendChild(keywordInputContainer);
  
  // 关键词列表 - 放在输入框前面
  const keywordsList = document.createElement('div');
  keywordsList.id = listId;
  keywordsList.className = 'keywords-list';
  keywordsList.style.display = 'flex';
  keywordsList.style.flexWrap = 'wrap';
  keywordsList.style.gap = '4px';
  keywordsList.style.alignItems = 'center';
  keywordInputContainer.appendChild(keywordsList);
  
  // 添加已有关键词
  keywordsArray.forEach(keyword => {
    const keywordTag = createKeywordTag(keyword, listId);
    keywordsList.appendChild(keywordTag);
  });
  
  // 输入区域容器
  const inputContainer = document.createElement('div');
  inputContainer.style.display = 'flex';
  inputContainer.style.alignItems = 'center';
  keywordInputContainer.appendChild(inputContainer);
  
  // 输入框
  const input = document.createElement('input');
  input.type = 'text';
  input.id = inputId;
  input.className = 'input-field';
  input.placeholder = '请选择';
  inputContainer.appendChild(input);
  
  // 添加按钮
  const addBtn = document.createElement('button');
  addBtn.textContent = '添加';
  addBtn.className = 'add-button';
  addBtn.dataset.target = inputId;
  addBtn.dataset.list = listId;
  inputContainer.appendChild(addBtn);
  
  return groupContainer;
}

// 创建关键词标签
function createKeywordTag(keyword, listId) {
  const tag = document.createElement('div');
  tag.className = 'keyword-tag';
  
  // 关键词文本
  const keywordText = document.createElement('span');
  keywordText.className = 'keyword-text';
  keywordText.textContent = keyword;
  keywordText.style.fontSize = '14px'; // 稍微大一点的字体
  tag.appendChild(keywordText);
  
  // 删除按钮
  const removeBtn = document.createElement('span');
  removeBtn.innerHTML = '&times;';
  removeBtn.className = 'keyword-remove';
  removeBtn.onclick = function() {
    // 从关键词数组中移除
    if (listId === 'include-keywords-list') {
      const index = includeKeywords.indexOf(keyword);
      if (index !== -1) {
        includeKeywords.splice(index, 1);
      }
    } else {
      const index = excludeKeywords.indexOf(keyword);
      if (index !== -1) {
        excludeKeywords.splice(index, 1);
      }
    }
    
    // 保存到 Chrome 存储
    saveKeywordsToStorage();
    
    // 从DOM中移除
    tag.remove();
    
    // 重新应用过滤
    applyFilter();
  };
  
  tag.appendChild(removeBtn);
  return tag;
}

// 初始化关键词事件监听
function initKeywordEvents() {
  // 包含关键词输入框事件
  const includeInput = document.getElementById('include-keywords-input');
  const includeList = document.getElementById('include-keywords-list');
  
  if (includeInput) {
    includeInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addKeyword(this.value.trim(), includeList, includeKeywords);
        this.value = '';
      }
    });
  }
  
  // 排除关键词输入框事件
  const excludeInput = document.getElementById('exclude-keywords-input');
  const excludeList = document.getElementById('exclude-keywords-list');
  
  if (excludeInput) {
    excludeInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addKeyword(this.value.trim(), excludeList, excludeKeywords);
        this.value = '';
      }
    });
  }
  
  // 添加按钮点击事件
  document.querySelectorAll('button[data-target]').forEach(btn => {
    btn.addEventListener('click', function() {
      const inputId = this.dataset.target;
      const listId = this.dataset.list;
      const input = document.getElementById(inputId);
      const list = document.getElementById(listId);
      const keywordsArray = listId === 'include-keywords-list' ? includeKeywords : excludeKeywords;
      
      if (input && list) {
        addKeyword(input.value.trim(), list, keywordsArray);
        input.value = '';
      }
    });
  });
}

// 添加关键词
function addKeyword(keyword, listElement, keywordsArray) {
  if (keyword && !keywordsArray.includes(keyword)) {
    keywordsArray.push(keyword);
    const keywordTag = createKeywordTag(keyword, listElement.id);
    listElement.appendChild(keywordTag);
    
    // 保存到 Chrome 存储
    saveKeywordsToStorage();
  }
}

// 保存关键词到 Chrome 存储
function saveKeywordsToStorage() {
  chrome.storage.sync.set({
    'includeKeywords': includeKeywords,
    'excludeKeywords': excludeKeywords
  });
}

// 应用过滤
function applyFilter(state) {
  console.log('应用过滤，包含关键词:', includeKeywords);
  console.log('应用过滤，排除关键词:', excludeKeywords);
  
  // 过滤状态逻辑
  if (state === 'apply') {
    // 应用过滤时激活过滤功能
    filterState.enabled = true;
    filterState.active = true;
    console.log('应用过滤');
  } else if (state === undefined) {
    // 不改变状态，只根据当前状态执行过滤
    console.log('根据当前状态执行过滤: ' + (filterState.active ? '激活' : '未激活'));
  }
  
  // 保留此检查以支持重置功能
  if (!filterState.enabled) {
    console.log('过滤功能未启用，跳过过滤');
    return;
  }
  
  // 使用 UmbrellaJS 找到表格主体
  const tableBody = u('.el-table__body');
  if (tableBody.length === 0) {
    showNotification('未找到表格元素', 'error');
    return;
  }
  
  // 获取所有行
  const rows = tableBody.find('tr');
  let filteredCount = 0;
  let totalRows = rows.length;
  
  // 如果过滤未激活或没有任何过滤条件，显示所有行
  if (!filterState.active || (includeKeywords.length === 0 && excludeKeywords.length === 0)) {
    rows.each(function(row) {
      u(row).attr('style', '');
    });
    if (!filterState.active) {
      showNotification(`过滤未激活：显示全部 ${totalRows} 行`, 'info');
    } else {
      showNotification(`已重置过滤：显示全部 ${totalRows} 行`, 'info');
    }
    return;
  }
  
  // 遍历每一行
  rows.each(function(row, index) {
    // 使用 UmbrellaJS 找到特定列 (el-table_1_column_4)
    const targetCell = u(row).find('.el-table_1_column_4');
    if (targetCell.length === 0) {
      console.log(`行 ${index}: 未找到目标列 el-table_1_column_4`);
      return;
    }
    
    // 获取文本内容 (从子元素)
    const cellText = targetCell.text().trim();
    console.log(`行 ${index}: 单元格文本 = "${cellText}"`);
    
    // 使用工具函数检查是否匹配关键词条件
    const result = filterByKeywords(cellText, includeKeywords, excludeKeywords);
    
    // 为了保持日志输出一致，我们仍然计算includeMatch和excludeMatch
    const includeMatch = includeKeywords.length === 0 || 
      includeKeywords.some(keyword => {
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(escapedKeyword, 'i').test(cellText);
      });
    
    const excludeMatch = excludeKeywords.length > 0 && 
      excludeKeywords.some(keyword => {
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(escapedKeyword, 'i').test(cellText);
      });
    
    console.log(`行 ${index}: 包含关键词匹配 = ${includeMatch}`, 
      includeKeywords.length > 0 ? `(关键词: ${includeKeywords.join(', ')})` : '(无包含关键词)');
    console.log(`行 ${index}: 排除关键词匹配 = ${excludeMatch}`, 
      excludeKeywords.length > 0 ? `(关键词: ${excludeKeywords.join(', ')})` : '(无排除关键词)');
    
    // 根据匹配结果显示或隐藏行 - 使用filterByKeywords函数的结果
    if (result) {
      console.log(`行 ${index}: 显示此行`);
      u(row).attr('style', '');
      filteredCount++;
    } else {
      console.log(`行 ${index}: 隐藏此行`);
      u(row).attr('style', 'display: none;');
    }
  });
  
  // 显示通知
  showNotification(`已应用过滤：显示 ${filteredCount}/${totalRows} 行，包含 ${includeKeywords.length} 个关键词，排除 ${excludeKeywords.length} 个关键词`, 'info');
}

// 设置事件监听器函数
function setupEventListeners() {
  // 使用 MutationObserver 监听 DOM 变化，以便在动态加载的元素上添加事件监听器
  const observer = new MutationObserver(function(mutations) {
    // 检查是否有分页元素或表单元素被添加到 DOM
    const paginationElements = document.querySelectorAll('.el-pagination.is-background');
    const formItemElements = document.querySelectorAll('.el-form-item__content');
    
    // 为分页元素添加点击事件监听器
    paginationElements.forEach(element => {
      if (!element.hasAttribute('filter-listener')) {
        element.setAttribute('filter-listener', 'true');
        element.addEventListener('click', function(event) {
          console.log('分页元素被点击，重新应用过滤');
          // 给一点延迟，确保分页完成后再应用过滤
          setTimeout(() => {
            // 如果过滤状态为激活状态，则重新应用过滤
            if (filterState.active) {
              applyFilter('apply');
            }
          }, 300);
        });
      }
    });
    
    // 为表单元素添加点击事件监听器
    formItemElements.forEach(element => {
      if (!element.hasAttribute('filter-listener')) {
        element.setAttribute('filter-listener', 'true');
        element.addEventListener('click', function(event) {
          console.log('表单元素被点击，重新应用过滤');
          // 给一点延迟，确保表单操作完成后再应用过滤
          setTimeout(() => {
            // 如果过滤状态为激活状态，则重新应用过滤
            if (filterState.active) {
              applyFilter('apply');
            }
          }, 300);
        });
      }
    });
  });
  
  // 开始观察整个文档
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // 立即检查现有元素
  const paginationElements = document.querySelectorAll('.el-pagination.is-background');
  const formItemElements = document.querySelectorAll('.el-form-item__content');
  
  paginationElements.forEach(element => {
    if (!element.hasAttribute('filter-listener')) {
      element.setAttribute('filter-listener', 'true');
      element.addEventListener('click', function(event) {
        console.log('分页元素被点击，重新应用过滤');
        setTimeout(() => {
          // 如果过滤状态为激活状态，则重新应用过滤
          if (filterState.active) {
            applyFilter('apply');
          }
        }, 300);
      });
    }
  });
  
  formItemElements.forEach(element => {
    if (!element.hasAttribute('filter-listener')) {
      element.setAttribute('filter-listener', 'true');
      element.addEventListener('click', function(event) {
        console.log('表单元素被点击，重新应用过滤');
        setTimeout(() => {
          // 如果过滤状态为激活状态，则重新应用过滤
          if (filterState.active) {
            applyFilter('apply');
          }
        }, 300);
      });
    }
  });
}

// 导出模块函数
export {
  loadKeywordsFromStorage,
  checkURLAndAddFilterUI,
  setupEventListeners,
  applyFilter,
  includeKeywords,
  excludeKeywords,
  filterState
};
