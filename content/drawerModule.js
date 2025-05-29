// drawerModule.js - 抽屉功能模块

// 动态导入API函数，避免静态导入在内容脚本中的问题
let getMyAuditTaskList = null;

// 初始化API函数
async function initializeAPI() {
  try {
    // 优先从全局作用域获取API函数
    if (window.getMyAuditTaskList) {
      getMyAuditTaskList = window.getMyAuditTaskList;
      console.log('✅ 从全局作用域获取API函数成功');
      return;
    }
    
    // 如果全局作用域没有，尝试动态导入
    const libModule = await import('../lib.js');
    getMyAuditTaskList = libModule.getMyAuditTaskList;
    console.log('✅ 动态导入API函数成功');
  } catch (error) {
    console.error('❌ API函数初始化失败:', error);
  }
}

// 立即初始化API
initializeAPI();

// 添加延迟初始化，确保全局函数已设置
setTimeout(() => {
  if (!getMyAuditTaskList) {
    console.log('🔄 延迟重新初始化API函数...');
    initializeAPI();
  }
}, 1000);

let drawerContainer = null;
let isDrawerOpen = false;

// 当前激活的路由配置
let currentRouteConfig = null;
let currentRouteName = null;

// 数据管理和功能实现
let currentPage = 1;
let totalPages = 1;
let totalRecords = 0;
let pageSize = 20;

// 存储当前数据
let currentData = [];

// 存储两种状态的数据统计
let state1Records = 0;
let state4Records = 0;

// 获取状态对应的样式类
function getStatusBadgeClass(status) {
  const statusMap = {
    'approved': 'badge-success',
    'pending': 'badge-warning', 
    'rejected': 'badge-error',
    'draft': 'badge-info'
  };
  return statusMap[status] || 'badge-secondary';
}

// 获取状态显示文本
function getStatusText(status) {
  const statusMap = {
    'approved': '已审核',
    'pending': '待审核',
    'rejected': '需修改',
    'draft': '草稿'
  };
  return statusMap[status] || '未知';
}

// 获取URL中的查询参数
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
  return urlParams.get(name) || hashParams.get(name);
}

// 获取当前任务ID
function getCurrentTaskId() {
  return getUrlParameter('taskid');
}

// 获取当前线索ID (如果URL中有的话)
function getCurrentClueId() {
  return getUrlParameter('clueID');
}

// 获取当前任务的完整信息
function getCurrentTaskInfo() {
  const taskId = getCurrentTaskId();
  const clueId = getCurrentClueId();
  return {
    taskId,
    clueId,
    hasTaskId: !!taskId,
    hasClueId: !!clueId
  };
}

// 高亮当前任务 - 增强版本，支持 taskId 和 clueID 双重匹配
function highlightCurrentTask(taskInfo = null) {
  // 如果没有传入参数，自动获取当前任务信息
  if (!taskInfo) {
    taskInfo = getCurrentTaskInfo();
  }
  
  // 如果既没有 taskId 也没有 clueId，直接返回
  if (!taskInfo.hasTaskId && !taskInfo.hasClueId) {
    console.log('📋 未检测到 taskid 或 clueID 参数，将显示所有数据');
    return false;
  }
  
  // 移除之前的高亮
  const previousHighlight = document.querySelector('#data-table-body tr.current-task');
  if (previousHighlight) {
    previousHighlight.classList.remove('current-task');
  }
  
  let currentTaskRow = null;
  let matchCriteria = '';
  
  // 优先使用 taskId 匹配，然后使用 clueId 匹配
  if (taskInfo.hasTaskId) {
    currentTaskRow = document.querySelector(`#data-table-body tr[data-task-id="${taskInfo.taskId}"]`);
    matchCriteria = `taskId: ${taskInfo.taskId}`;
    
    // 如果同时有 clueId，验证是否匹配
    if (currentTaskRow && taskInfo.hasClueId) {
      const rowClueId = currentTaskRow.getAttribute('data-clue-id');
      if (rowClueId && rowClueId !== taskInfo.clueId) {
        console.warn(`⚠️ 任务ID ${taskInfo.taskId} 匹配，但线索ID不匹配: 期望 ${taskInfo.clueId}, 实际 ${rowClueId}`);
        // 可以选择是否继续高亮，这里选择继续，但给出警告
      }
      matchCriteria += `, clueId: ${taskInfo.clueId}`;
    }
  } else if (taskInfo.hasClueId) {
    // 如果只有 clueId，通过 clueId 匹配
    currentTaskRow = document.querySelector(`#data-table-body tr[data-clue-id="${taskInfo.clueId}"]`);
    matchCriteria = `clueId: ${taskInfo.clueId}`;
  }
  
  if (currentTaskRow) {
    currentTaskRow.classList.add('current-task');
    
    // 滚动到当前任务位置
    const tableContainer = currentTaskRow.closest('.overflow-auto');
    if (tableContainer) {
      setTimeout(() => {
        currentTaskRow.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
    
    console.log(`✅ 高亮当前任务 (${matchCriteria})`);
    return true;
  }
  
  console.log(`📋 当前页面未找到匹配任务 (${matchCriteria})，显示所有数据`);
  return false;
}

// 加载表格数据
async function loadTableData(page = 1) {
  const tbody = document.getElementById('data-table-body');
  if (!tbody) return;
  
  // 检查API函数是否可用
  if (!getMyAuditTaskList) {
    console.warn('⚠️ API函数未初始化，尝试重新初始化...');
    await initializeAPI();
    
    // 如果仍然不可用，显示错误
    if (!getMyAuditTaskList) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-8">
            <div class="text-error mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              API函数未初始化
            </div>
            <div class="text-sm text-gray-500 mb-4">无法加载数据，请检查扩展配置</div>
            <button class="btn btn-sm btn-primary" data-action="retry-load" data-page="${page}">
              重试
            </button>
          </td>
        </tr>
      `;
      
      // 为重试按钮添加事件监听器
      const retryBtn = tbody.querySelector('[data-action="retry-load"]');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          const retryPage = parseInt(retryBtn.dataset.page) || 1;
          loadTableData(retryPage);
        });
      }
      return;
    }
  }
  
  // 显示加载状态
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center py-8">
        <div class="loading loading-spinner loading-md"></div>
        <div class="mt-2">正在加载数据...</div>
      </td>
    </tr>
  `;
  
  try {
    console.log('🔄 开始请求数据...', { page, pageSize });
    
    // 同时请求state为1和state为4的数据
    const [response1, response4] = await Promise.all([
      getMyAuditTaskList({
        pn: page,
        rn: pageSize,
        clueID: '',
        clueType: '',
        step: '',
        subject: '',
        state: 1
      }),
      getMyAuditTaskList({
        pn: page,
        rn: pageSize,
        clueID: '',
        clueType: '',
        step: '',
        subject: '',
        state: 4
      })
    ]);
    
    console.log('📡 State 1 API响应:', response1);
    console.log('📡 State 4 API响应:', response4);
    
    // 验证两个响应都是有效的
    if ((response1 && response1.errno === 0 && response1.data) ||
        (response4 && response4.errno === 0 && response4.data)) {
      
      // 提取数据列表
      const list1 = (response1 && response1.errno === 0 && response1.data) ? response1.data.list || [] : [];
      const list4 = (response4 && response4.errno === 0 && response4.data) ? response4.data.list || [] : [];
      
      // 合并两个状态的数据
      const combinedList = [...list1, ...list4];
      
      // 为数据项添加状态标识，便于区分
      const processedList = combinedList.map(item => ({
        ...item,
        originalState: list1.includes(item) ? 1 : 4
      }));
      
      // 计算总记录数（两个状态的数据总和）
      const total1 = (response1 && response1.errno === 0 && response1.data) ? response1.data.total || 0 : 0;
      const total4 = (response4 && response4.errno === 0 && response4.data) ? response4.data.total || 0 : 0;
      const combinedTotal = total1 + total4;
      
      // 更新分页信息
      totalRecords = combinedTotal;
      totalPages = Math.ceil(combinedTotal / pageSize);
      currentData = processedList;
      currentPage = page;
      
      // 更新状态统计信息
      state1Records = total1;
      state4Records = total4;
      
      console.log('📊 合并数据统计:', { 
        total1, 
        total4, 
        combinedTotal, 
        totalPages, 
        currentPage, 
        dataLength: currentData.length 
      });
      
      // 渲染数据
      if (currentData.length > 0) {
        tbody.innerHTML = currentData.map(item => `
          <tr class="hover:bg-base-200" data-task-id="${item.taskID}" data-clue-id="${item.clueID}" data-state="${item.originalState}">
            <td class="font-mono text-sm">${item.clueID}</td>
            <td class="font-medium max-w-xs truncate" title="${item.brief.replace(/\n/g, ' ')}">${item.brief.replace(/\n/g, ' ').substring(0, 50)}${item.brief.length > 50 ? '...' : ''}</td>
            <td class="text-sm">${item.stepName}</td>
            <td class="text-sm">${item.subjectName}</td>
            <td>
              <div class="flex items-center gap-2">
                <span class="badge badge-xs ${item.originalState === 1 ? 'badge-primary' : 'badge-secondary'}" title="状态: ${item.originalState}">
                  ${item.originalState === 1 ? 'S1' : 'S4'}
                </span>
                <button class="btn btn-primary btn-sm" data-action="audit-task" data-task-id="${item.taskID}">
                  审核
                </button>
              </div>
            </td>
          </tr>
        `).join('');
        
        // 为审核按钮添加事件监听器
        const auditButtons = tbody.querySelectorAll('[data-action="audit-task"]');
        auditButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            const taskId = btn.dataset.taskId;
            auditTask(taskId);
          });
        });
        
        // 为表格行添加点击事件，用于选择
        const tableRows = tbody.querySelectorAll('tr[data-task-id]');
        tableRows.forEach(row => {
          row.addEventListener('click', () => {
            const taskId = row.dataset.taskId;
            selectQuestion(taskId);
          });
        });
        
        // 高亮当前任务（从URL获取taskid和clueID）
        const currentTaskInfo = getCurrentTaskInfo();
        if (currentTaskInfo.hasTaskId || currentTaskInfo.hasClueId) {
          console.log(`🎯 检测到当前任务信息:`, currentTaskInfo);
          setTimeout(() => {
            highlightCurrentTask(currentTaskInfo);
          }, 100);
        }
      } else {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center py-8 text-gray-500">
              暂无数据
            </td>
          </tr>
        `;
      }
      
      // 更新分页控件
      updatePagination();
      
      // 更新数据统计信息
      updateDataStats();
      
    } else {
      throw new Error('两个状态的数据都请求失败');
    }
    
  } catch (error) {
    console.error('❌ 加载数据失败:', error);
    
    // 显示错误状态
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-8">
          <div class="text-error mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            加载失败
          </div>
          <div class="text-sm text-gray-500 mb-4">${error.message}</div>
          <button class="btn btn-sm btn-primary" data-action="reload" data-page="${page}">
            重新加载
          </button>
        </td>
      </tr>
    `;
    
    // 为重新加载按钮添加事件监听器
    const reloadBtn = tbody.querySelector('[data-action="reload"]');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        const reloadPage = parseInt(reloadBtn.dataset.page) || 1;
        loadTableData(reloadPage);
      });
    }
    
    // 即使加载失败也调整高度
    setTimeout(() => {
      adjustTableHeight();
    }, 100);
  }
}

// 审核任务功能
function auditTask(taskID) {
  console.log('审核任务:', taskID);
  
  // 修改当前访问路径
  const newPath = `/edu-shop-web/#/question-task/audit-pool-edit?taskid=${taskID}`;
  
  // 先关闭抽屉，提升用户体验
  closeDrawer();
  
  // 显示提示信息
  const toast = document.createElement('div');
  toast.className = 'toast toast-top toast-center z-50';
  toast.innerHTML = `
    <div class="alert alert-info">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>正在跳转到审核页面 (任务ID: ${taskID})...</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // 延迟一小段时间显示提示，然后强制刷新页面
  setTimeout(() => {
    toast.remove();
    console.log(`跳转到审核页面: ${newPath}`);
    
    // 先替换URL到新页面
    window.location.replace(newPath);
    
    // 然后执行强制刷新，确保页面完全重新加载
    setTimeout(() => {
      window.location.reload();
    }, 100); // 短暂延迟确保URL替换完成
  }, 800); // 减少等待时间，提升用户体验
}

// 更新翻页按钮状态
function updatePagination() {
  const paginationContainer = document.querySelector('.btn-group');
  if (!paginationContainer) return;
  
  // 重新生成分页按钮
  let paginationHTML = `<button class="btn btn-sm" data-action="page-prev">«</button>`;
  
  // 计算显示的页码范围
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  // 如果结束页码不足5个，调整开始页码
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  // 如果不是从第1页开始，显示第1页和省略号
  if (startPage > 1) {
    paginationHTML += `<button class="btn btn-sm" data-action="page-number" data-page="1">1</button>`;
    if (startPage > 2) {
      paginationHTML += `<button class="btn btn-sm btn-disabled">...</button>`;
    }
  }
  
  // 显示页码按钮
  for (let i = startPage; i <= endPage; i++) {
    const activeClass = i === currentPage ? 'btn-active' : '';
    paginationHTML += `<button class="btn btn-sm ${activeClass}" data-action="page-number" data-page="${i}">${i}</button>`;
  }
  
  // 如果不是到最后一页，显示省略号和最后一页
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<button class="btn btn-sm btn-disabled">...</button>`;
    }
    paginationHTML += `<button class="btn btn-sm" data-action="page-number" data-page="${totalPages}">${totalPages}</button>`;
  }
  
  paginationHTML += `<button class="btn btn-sm" data-action="page-next">»</button>`;
  
  paginationContainer.innerHTML = paginationHTML;
  
  // 为分页按钮添加事件监听器
  const pageButtons = paginationContainer.querySelectorAll('button[data-action]');
  pageButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'page-prev') {
        changePage('prev');
      } else if (action === 'page-next') {
        changePage('next');
      } else if (action === 'page-number') {
        const page = parseInt(btn.dataset.page);
        changePage(page);
      }
    });
  });
  
  // 更新前后翻页按钮状态
  const prevBtn = paginationContainer.querySelector('[data-action="page-prev"]');
  const nextBtn = paginationContainer.querySelector('[data-action="page-next"]');
  
  if (prevBtn) {
    prevBtn.disabled = currentPage === 1;
    prevBtn.classList.toggle('btn-disabled', currentPage === 1);
  }
  
  if (nextBtn) {
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.classList.toggle('btn-disabled', currentPage === totalPages);
  }
}

// 翻页功能
function changePage(page) {
  if (page === 'prev') {
    if (currentPage > 1) {
      loadTableData(currentPage - 1);
    }
  } else if (page === 'next') {
    if (currentPage < totalPages) {
      loadTableData(currentPage + 1);
    }
  } else if (typeof page === 'number' && page >= 1 && page <= totalPages) {
    loadTableData(page);
  }
}

// 选择题目
function selectQuestion(taskId) {
  console.log('选择任务:', taskId);
  
  // 移除之前的选中状态（但保留当前任务的高亮）
  const rows = document.querySelectorAll('#data-table-body tr');
  rows.forEach(row => {
    if (!row.classList.contains('current-task')) {
      row.classList.remove('bg-primary', 'text-primary-content');
    }
  });
  
  // 高亮选中的行（如果不是当前任务）
  const selectedRow = document.querySelector(`#data-table-body tr[data-task-id="${taskId}"]`);
  if (selectedRow && !selectedRow.classList.contains('current-task')) {
    selectedRow.classList.add('bg-primary', 'text-primary-content');
  }
  
  // 更新下一题按钮状态
  const nextButton = document.querySelector('.btn-primary.btn-wide');
  if (nextButton) {
    const currentTaskInfo = getCurrentTaskInfo();
    
    // 检查选中的任务是否为当前任务
    const isCurrentTask = (currentTaskInfo.hasTaskId && taskId === currentTaskInfo.taskId) ||
                         (currentTaskInfo.hasClueId && selectedRow && selectedRow.getAttribute('data-clue-id') === currentTaskInfo.clueId);
    
    if (isCurrentTask) {
      nextButton.textContent = `当前任务 ${taskId} ✓`;
      nextButton.classList.add('btn-success');
      nextButton.classList.remove('btn-primary');
    } else {
      nextButton.textContent = `处理任务 ${taskId} →`;
      nextButton.classList.remove('btn-disabled', 'btn-success');
      nextButton.classList.add('btn-primary');
    }
  }
}

// 下一题功能
function goToNextQuestion() {
  const selectedRow = document.querySelector('#data-table-body tr.bg-primary');
  if (!selectedRow) {
    // 如果没有选中的行，尝试获取第一行数据
    const firstRow = document.querySelector('#data-table-body tr');
    if (!firstRow) {
      alert('暂无数据可处理');
      return;
    }
    
    // 获取第一行的任务ID
    const firstTaskButton = firstRow.querySelector('[data-action="audit-task"]');
    if (firstTaskButton) {
      const taskId = firstTaskButton.dataset.taskId;
      console.log('处理第一个任务:', taskId);
      auditTask(taskId);
      return;
    }
    
    alert('无法获取任务信息');
    return;
  }
  
  // 从选中行获取任务ID
  const auditButton = selectedRow.querySelector('[data-action="audit-task"]');
  if (auditButton) {
    const currentTaskId = auditButton.dataset.taskId;
    console.log('处理选中的任务:', currentTaskId);
    auditTask(currentTaskId);
  } else {
    alert('无法获取任务信息');
  }
}

// 刷新数据
function refreshData() {
  loadTableData(currentPage);
}

// 关闭抽屉
function closeDrawer() {
  if (drawerContainer) {
    drawerContainer.classList.remove('drawer-open');
    
    // 强制设置抽屉隐藏到右侧外部
    const drawerContent = drawerContainer.querySelector('.drawer-content');
    if (drawerContent) {
      drawerContent.style.right = '-400px';
      drawerContent.style.left = 'auto';
    }
  }
  isDrawerOpen = false;
  
  // 更新按钮状态
  const button = document.getElementById('drawer-float-button');
  if (button) {
    button.classList.remove('active');
    button.style.transform = 'scale(1)';
  }
}

// 检查URL并添加圆形按钮
function checkURLAndAddDrawerButton() {
  const currentURL = window.location.href;
  console.log('🔍 检查URL:', currentURL);
  
  // 直接判断URL是否匹配目标页面
  if (currentURL.includes('/edu-shop-web/#/question-task/audit-pool-edit')) {
    currentRouteName = 'audit-pool-edit';
    currentRouteConfig = {
      title: 'edu-exp',
      position: { bottom: 30, right: 30 }
    };
    
    console.log('✅ URL匹配成功: 审核池编辑页面');
    
    // 检查是否已经添加过按钮
    if (!document.getElementById('drawer-float-button')) {
      console.log('🔘 添加浮动按钮');
      addDrawerButton(currentRouteConfig);
    } else {
      console.log('⚠️ 按钮已存在');
    }
  } else {
    // 如果URL不匹配，移除按钮和抽屉
    console.log('❌ 无匹配路由，移除元素');
    currentRouteConfig = null;
    currentRouteName = null;
    removeDrawerElements();
  }
}

// 创建抽屉
function createDrawer() {
  if (drawerContainer || !currentRouteConfig) return;
  
  drawerContainer = document.createElement('div');
  drawerContainer.id = 'drawer-container';
  drawerContainer.className = 'drawer-container';
  
  // 创建遮罩层
  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';
  overlay.addEventListener('click', (e) => {
    // 确保点击的不是浮动按钮
    if (e.target === overlay) {
      closeDrawer();
    }
  });
  
  // 创建抽屉内容 - 右侧抽屉
  const drawer = document.createElement('div');
  drawer.className = 'drawer-content';
  
  // 强制设置右侧定位样式
  drawer.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    right: -400px !important;
    left: auto !important;
    width: 400px !important;
    height: 100vh !important;
    background: white !important;
    z-index: 100002 !important;
    transition: right 0.3s ease !important;
    border-left: 1px solid #e5e7eb !important;
    box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1) !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  `;
  
  // 创建抽屉头部
  const header = createDrawerHeader(currentRouteConfig);
  
  // 创建抽屉主体内容
  const body = createDrawerBody(currentRouteConfig);
  
  drawer.appendChild(header);
  drawer.appendChild(body);
  
  drawerContainer.appendChild(overlay);
  drawerContainer.appendChild(drawer);
  
  document.body.appendChild(drawerContainer);
  
  // 确保浮动按钮在抽屉之后添加，保持在最上层
  const floatButton = document.getElementById('drawer-float-button');
  if (floatButton) {
    document.body.appendChild(floatButton);
  }
  
  // 更新时间
  updateLastUpdateTime();
  
  // 添加窗口大小改变的监听器
  if (!window.drawerResizeListener) {
    window.drawerResizeListener = () => {
      if (isDrawerOpen) {
        adjustTableHeight();
      }
    };
    window.addEventListener('resize', window.drawerResizeListener);
  }
}

// 创建抽屉头部
function createDrawerHeader(config) {
  const header = document.createElement('div');
  header.className = 'card-header flex items-center justify-between px-3 py-2 border-b border-base-300';
  header.innerHTML = `
    <h3 class="card-title text-base font-bold text-primary">${config.title || '数据面板'}</h3>
    <button class="btn btn-xs btn-circle btn-ghost hover:btn-error" data-action="close-drawer">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  `;
  
  // 为关闭按钮添加事件监听器
  const closeBtn = header.querySelector('[data-action="close-drawer"]');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDrawer);
  }
  
  return header;
}

// 创建抽屉主体
function createDrawerBody(config) {
  const body = document.createElement('div');
  body.className = 'card-body px-3 py-2 flex flex-col h-full';
  
  // 直接创建数据表格内容，不使用标签导航
  const dataContent = createDataTab();
  dataContent.className = 'flex-1 flex flex-col';
  
  body.appendChild(dataContent);
  
  return body;
}

// 创建数据表格 Tab
function createDataTab() {
  const container = document.createElement('div');
  
  // 数据统计信息
  const statsContainer = document.createElement('div');
  statsContainer.className = 'flex justify-between items-center mb-2 text-sm text-gray-600';
  statsContainer.innerHTML = `
    <div id="data-stats" class="flex flex-col gap-1">
      <div>总计: <span id="total-records">0</span> 条记录</div>
      <div class="flex gap-4 text-xs">
        <span>状态1: <span id="state1-records" class="text-primary font-medium">0</span> 条</span>
        <span>状态4: <span id="state4-records" class="text-secondary font-medium">0</span> 条</span>
      </div>
    </div>
    <button class="btn btn-xs btn-ghost" data-action="refresh-data" title="刷新数据">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      刷新
    </button>
  `;
  
  // 为刷新按钮添加事件监听器
  const refreshBtn = statsContainer.querySelector('[data-action="refresh-data"]');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshData);
  }
  
  // 表格容器
  const tableContainer = document.createElement('div');
  tableContainer.className = 'overflow-auto flex-1 mb-2';
  tableContainer.style.cssText = `
    overflow-y: auto;
    overflow-x: auto;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  `;
  
  const table = document.createElement('table');
  table.className = 'table table-compact table-zebra w-full';
  table.innerHTML = `
    <thead>
      <tr>
        <th>线索ID</th>
        <th>线索内容</th>
        <th>学段</th>
        <th>学科</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody id="data-table-body">
      <!-- 数据将通过 JavaScript 动态生成 -->
    </tbody>
  `;
  
  tableContainer.appendChild(table);
  
  // 添加鼠标滚轮事件处理，优化滚动体验
  tableContainer.addEventListener('wheel', (e) => {
    // 防止滚动事件冒泡到父容器
    e.stopPropagation();
    
    // 确保在表格内部滚动
    const { scrollTop, scrollHeight, clientHeight } = tableContainer;
    const { scrollLeft, scrollWidth, clientWidth } = tableContainer;
    
    // 垂直滚动处理
    if (e.deltaY !== 0) {
      const atTop = scrollTop === 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
      
      // 如果不在边界，阻止默认行为，让容器内部滚动
      if (!atTop && !atBottom) {
        e.preventDefault();
      } else if (atTop && e.deltaY < 0) {
        // 在顶部且向上滚动，阻止默认行为
        e.preventDefault();
      } else if (atBottom && e.deltaY > 0) {
        // 在底部且向下滚动，阻止默认行为
        e.preventDefault();
      }
    }
    
    // 水平滚动处理
    if (e.deltaX !== 0) {
      const atLeft = scrollLeft === 0;
      const atRight = scrollLeft + clientWidth >= scrollWidth - 1;
      
      if (!atLeft && !atRight) {
        e.preventDefault();
      }
    }
  }, { passive: false });
  
  // 添加滚动指示器
  const scrollIndicator = document.createElement('div');
  scrollIndicator.className = 'text-xs text-gray-400 text-center py-1';
  scrollIndicator.id = 'scroll-indicator';
  scrollIndicator.textContent = '使用鼠标滚轮或拖拽滚动条查看更多数据';
  
  // 监听滚动事件更新指示器
  tableContainer.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = tableContainer;
    const { scrollLeft, scrollWidth, clientWidth } = tableContainer;
    
    if (scrollHeight > clientHeight || scrollWidth > clientWidth) {
      const verticalProgress = scrollHeight > clientHeight ? 
        Math.round((scrollTop / (scrollHeight - clientHeight)) * 100) : 0;
      const horizontalProgress = scrollWidth > clientWidth ? 
        Math.round((scrollLeft / (scrollWidth - clientWidth)) * 100) : 0;
      
      let message = '';
      if (scrollHeight > clientHeight && scrollWidth > clientWidth) {
        message = `垂直: ${verticalProgress}% | 水平: ${horizontalProgress}%`;
      } else if (scrollHeight > clientHeight) {
        message = `滚动进度: ${verticalProgress}%`;
      } else if (scrollWidth > clientWidth) {
        message = `水平滚动: ${horizontalProgress}%`;
      }
      
      scrollIndicator.textContent = message || '使用鼠标滚轮或拖拽滚动条查看更多数据';
      scrollIndicator.style.opacity = '1';
    } else {
      scrollIndicator.textContent = '所有数据已显示';
      scrollIndicator.style.opacity = '0.6';
    }
  });
  
  // 翻页按钮组
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'flex justify-center mb-2';
  
  const pagination = document.createElement('div');
  pagination.className = 'btn-group';
  // 分页按钮将由 updatePagination 函数动态生成
  
  paginationContainer.appendChild(pagination);
  
  // 下一题按钮
  const nextButtonContainer = document.createElement('div');
  nextButtonContainer.className = 'flex justify-center';
  
  const nextButton = document.createElement('button');
  nextButton.className = 'btn btn-primary btn-wide';
  nextButton.innerHTML = '下一题 →';
  nextButton.addEventListener('click', () => {
    console.log('下一题按钮被点击');
    goToNextQuestion();
  });
  
  nextButtonContainer.appendChild(nextButton);
  
  container.appendChild(statsContainer);
  container.appendChild(tableContainer);
  container.appendChild(scrollIndicator);
  container.appendChild(paginationContainer);
  container.appendChild(nextButtonContainer);
  
  // 延迟初始化表格数据，确保API函数已经初始化
  setTimeout(() => {
    const currentTaskInfo = getCurrentTaskInfo();
    if (currentTaskInfo.hasTaskId || currentTaskInfo.hasClueId) {
      console.log(`🎯 检测到当前任务信息:`, currentTaskInfo, `，尝试导航到对应页面`);
      navigateToCurrentTask();
    } else {
      loadTableData(1);
    }
  }, 100);
  
  return container;
}

// 更新数据统计信息
function updateDataStats() {
  const totalRecordsElement = document.getElementById('total-records');
  const state1RecordsElement = document.getElementById('state1-records');
  const state4RecordsElement = document.getElementById('state4-records');
  
  if (totalRecordsElement) {
    totalRecordsElement.textContent = totalRecords;
  }
  
  if (state1RecordsElement) {
    state1RecordsElement.textContent = state1Records;
  }
  
  if (state4RecordsElement) {
    state4RecordsElement.textContent = state4Records;
  }
  
  // 调整表格高度
  adjustTableHeight();
}

// 动态调整表格高度
function adjustTableHeight() {
  const tableContainer = document.querySelector('.overflow-auto.flex-1.mb-2');
  if (!tableContainer) return;
  
  // 获取视窗高度
  const viewportHeight = window.innerHeight;
  
  // 获取抽屉容器
  const drawerContent = document.querySelector('.drawer-content');
  if (!drawerContent) return;
  
  // 计算其他元素的高度
  const header = drawerContent.querySelector('.card-header');
  const statsContainer = drawerContent.querySelector('#data-stats').closest('div');
  const scrollIndicator = document.getElementById('scroll-indicator');
  const paginationContainer = drawerContent.querySelector('.btn-group').closest('div');
  const nextButtonContainer = drawerContent.querySelector('.btn-primary.btn-wide').closest('div');
  
  let usedHeight = 0;
  
  // 计算已使用的高度
  if (header) usedHeight += header.offsetHeight;
  if (statsContainer) usedHeight += statsContainer.offsetHeight;
  if (scrollIndicator) usedHeight += scrollIndicator.offsetHeight;
  if (paginationContainer) usedHeight += paginationContainer.offsetHeight;
  if (nextButtonContainer) usedHeight += nextButtonContainer.offsetHeight;
  
  // 添加一些padding和margin的估算
  usedHeight += 60; // 预留空间用于各种padding、margin和边框
  
  // 计算可用于表格的最大高度（留出一些缓冲空间）
  const maxTableHeight = Math.max(300, viewportHeight - usedHeight - 100);
  
  // 设置表格容器的最大高度
  tableContainer.style.maxHeight = `${maxTableHeight}px`;
  
  console.log(`📐 动态调整表格高度: ${maxTableHeight}px (视窗高度: ${viewportHeight}px, 已用高度: ${usedHeight}px)`);
}

// 切换抽屉状态
function toggleDrawer() {
  if (isDrawerOpen) {
    closeDrawer();
  } else {
    openDrawer();
  }
}

// 打开抽屉
function openDrawer() {
  if (!drawerContainer) {
    createDrawer();
  }
  
  drawerContainer.classList.add('drawer-open');
  isDrawerOpen = true;
  
  // 强制设置抽屉位置到右侧
  const drawerContent = drawerContainer.querySelector('.drawer-content');
  if (drawerContent) {
    drawerContent.style.right = '0px';
    drawerContent.style.left = 'auto';
  }
  
  // 更新按钮状态，确保按钮保持可见
  const button = document.getElementById('drawer-float-button');
  if (button) {
    button.classList.add('active');
    button.style.transform = 'scale(1.05) rotate(45deg)';
    // 强制确保按钮可见性
    button.style.zIndex = '999999';
    button.style.visibility = 'visible';
    button.style.opacity = '1';
    button.style.pointerEvents = 'auto';
  }
  
  // 延迟调整表格高度，确保DOM元素已经渲染完成
  setTimeout(() => {
    adjustTableHeight();
  }, 100);
}

// 移除抽屉相关元素
function removeDrawerElements() {
  const button = document.getElementById('drawer-float-button');
  if (button) {
    button.remove();
  }
  
  if (drawerContainer) {
    drawerContainer.remove();
    drawerContainer = null;
  }
  
  isDrawerOpen = false;
}

// 处理工具按钮点击
function handleToolClick(toolId) {
  console.log('Tool clicked:', toolId, 'on route:', currentRouteName);
  // 可以在这里添加具体的工具处理逻辑
  alert(`功能 "${toolId}" 暂未实现`);
}

// 更新最后更新时间
function updateLastUpdateTime() {
  const timeElement = document.getElementById('last-update');
  if (timeElement) {
    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString();
  }
}

// 添加样式
function addDrawerStyles() {
  if (document.getElementById('drawer-styles')) return;
  
  const styles = document.createElement('style');
  styles.id = 'drawer-styles';
  styles.textContent = `
    /* 浮动按钮激活状态 - 静态样式 */
    .drawer-float-button.active {
      transform: scale(1.05) rotate(45deg) !important;
      background: #f5576c !important;
    }
    
    /* 禁用所有动画 */
    .drawer-float-button.no-animation,
    .drawer-float-button:not(.active) {
      animation: none !important;
    }
    
    /* 抽屉容器样式 - 固定在整个视窗 */
    .drawer-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 100000;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    
    .drawer-container.drawer-open {
      pointer-events: all;
      opacity: 1;
      visibility: visible;
    }
    
    /* 遮罩层样式 */
    .drawer-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 100001;
    }
    
    .drawer-container.drawer-open .drawer-overlay {
      opacity: 1;
    }
    
    /* 右侧抽屉样式 - 强制右侧定位 */
    .drawer-content {
      position: fixed !important;
      top: 0 !important;
      right: -400px !important;
      left: auto !important;
      width: 400px !important;
      height: 100vh !important;
      border-radius: 0 !important;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border-left: 1px solid #e5e7eb;
      border-right: none !important;
      background: white !important;
      box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1) !important;
      transition: right 0.3s ease !important;
      z-index: 100002 !important;
      margin-left: auto !important;
      margin-right: 0 !important;
      transform: translateX(0) !important;
    }
    
    .drawer-container.drawer-open .drawer-content {
      right: 0 !important;
      left: auto !important;
      transform: translateX(0) !important;
    }
    
    /* 额外确保右侧定位的样式 */
    .drawer-container .drawer-content {
      right: -400px !important;
      left: auto !important;
      margin-left: auto !important;
      margin-right: 0 !important;
    }
    
    .drawer-container.drawer-open .drawer-content {
      right: 0 !important;
      left: auto !important;
    }
    
    /* 响应式设计 - 确保在小屏幕上也在右侧 */
    @media (max-width: 768px) {
      .drawer-content {
        width: calc(100% - 2rem) !important;
        right: calc(-100% + 2rem) !important;
      }
      
      .drawer-container.drawer-open .drawer-content {
        right: 0 !important;
      }
      
      .drawer-float-button {
        bottom: 20px !important;
        right: 20px !important;
        width: 50px !important;
        height: 50px !important;
      }
      
      .drawer-float-button svg {
        width: 24px !important;
        height: 24px !important;
      }
    }
    
    @media (max-width: 480px) {
      .drawer-content {
        width: 100% !important;
        right: -100% !important;
      }
      
      .drawer-container.drawer-open .drawer-content {
        right: 0 !important;
      }
    }
    
    /* 确保浮动按钮始终可见 - 关键样式 */
    #drawer-float-button {
      position: fixed !important;
      z-index: 999999 !important;
      pointer-events: auto !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      visibility: visible !important;
      opacity: 1 !important;
      display: flex !important;
    }
    
    /* 确保按钮在抽屉打开时也保持可见 */
    .drawer-container.drawer-open ~ #drawer-float-button,
    .drawer-container.drawer-open + #drawer-float-button {
      z-index: 999999 !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }
    
    #drawer-float-button:hover {
      cursor: pointer !important;
    }
    
    /* 表格滚动优化 - 支持垂直和水平滚动 */
    .overflow-auto, .overflow-x-auto {
      scrollbar-width: thin;
      scrollbar-color: rgba(0,0,0,0.2) transparent;
      scroll-behavior: smooth;
    }
    
    /* 水平滚动条样式 */
    .overflow-auto::-webkit-scrollbar, .overflow-x-auto::-webkit-scrollbar {
      height: 6px;
      width: 6px;
    }
    
    .overflow-auto::-webkit-scrollbar-track, .overflow-x-auto::-webkit-scrollbar-track {
      background: transparent;
      border-radius: 3px;
    }
    
    .overflow-auto::-webkit-scrollbar-thumb, .overflow-x-auto::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.2);
      border-radius: 3px;
    }
    
    .overflow-auto::-webkit-scrollbar-thumb:hover, .overflow-x-auto::-webkit-scrollbar-thumb:hover {
      background: rgba(0,0,0,0.3);
    }
    
    /* 表格容器特殊优化 */
    .overflow-auto {
      /* 确保平滑滚动 */
      -webkit-overflow-scrolling: touch;
      /* 鼠标滚轮滚动优化 */
      scroll-behavior: smooth;
    }
    
    /* 表格固定头部 */
    .overflow-auto table thead th {
      position: sticky;
      top: 0;
      background: white;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    /* 当前任务高亮样式 - 简化版本，只改变背景色 */
    #data-table-body tr.current-task {
      background: #fef3c7 !important;
      color: inherit !important;
    }
    
    #data-table-body tr.current-task:hover {
      background: #fde68a !important;
    }
    
    #data-table-body tr.current-task td {
      color: inherit !important;
    }
    
    /* 确保抽屉内容不被其他元素遮挡 */
    .drawer-content * {
      position: relative;
      z-index: 1;
    }
  `;
  
  document.head.appendChild(styles);
}

// 添加圆形浮动按钮
function addDrawerButton(config) {
  // 创建浮动按钮
  const floatButton = document.createElement('div');
  floatButton.id = 'drawer-float-button';
  floatButton.className = 'btn btn-circle btn-primary fixed shadow-lg no-animation';
  
  // 设置按钮的基本样式
  floatButton.style.cssText = `
    z-index: 999999 !important;
    width: 60px !important;
    height: 60px !important;
    background: #667eea !important;
    border: 2px solid rgba(255, 255, 255, 0.2) !important;
    visibility: visible !important;
    opacity: 1 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    pointer-events: auto !important;
  `;
  
  floatButton.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: white;">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    </svg>
  `;
  
  // 设置按钮位置
  if (config.position) {
    floatButton.style.bottom = `${config.position.bottom}px`;
    floatButton.style.right = `${config.position.right}px`;
  }
  
  // 添加点击事件
  floatButton.addEventListener('click', toggleDrawer);
  
  // 添加简单的悬停效果
  floatButton.addEventListener('mouseenter', () => {
    floatButton.style.transform = 'scale(1.05)';
  });
  
  floatButton.addEventListener('mouseleave', () => {
    if (!floatButton.classList.contains('active')) {
      floatButton.style.transform = 'scale(1)';
    }
  });
  
  // 添加样式
  addDrawerStyles();
  
  // 添加到页面
  document.body.appendChild(floatButton);
  
  console.log('✅ 浮动按钮已添加到页面');
}

// 查找当前任务所在的页面 - 增强版本，支持 taskId 和 clueID 匹配
async function findCurrentTaskPage(taskInfo = null) {
  // 如果没有传入参数，自动获取当前任务信息
  if (!taskInfo) {
    taskInfo = getCurrentTaskInfo();
  }
  
  // 如果既没有 taskId 也没有 clueId，直接返回
  if (!taskInfo.hasTaskId && !taskInfo.hasClueId) {
    console.log('📋 未检测到 taskid 或 clueID 参数，将显示所有数据');
    return null;
  }
  
  console.log(`🔍 查找任务所在页面...`, taskInfo);
  
  // 检查当前页面是否包含该任务
  const currentTaskRow = document.querySelector(`#data-table-body tr[data-task-id="${taskInfo.taskId}"], #data-table-body tr[data-clue-id="${taskInfo.clueId}"]`);
  if (currentTaskRow) {
    console.log(`✅ 任务在当前页面 ${currentPage}`);
    return currentPage;
  }
  
  // 如果当前页面没有，搜索其他页面
  for (let page = 1; page <= totalPages; page++) {
    if (page === currentPage) continue; // 跳过当前页面，已经检查过了
    
    try {
      console.log(`🔍 检查第 ${page} 页...`);
      
      // 同时请求两种状态的数据
      const [response1, response4] = await Promise.all([
        getMyAuditTaskList({
          pn: page,
          rn: pageSize,
          clueID: '',
          clueType: '',
          step: '',
          subject: '',
          state: 1
        }),
        getMyAuditTaskList({
          pn: page,
          rn: pageSize,
          clueID: '',
          clueType: '',
          step: '',
          subject: '',
          state: 4
        })
      ]);
      
      // 检查两种状态的数据
      const list1 = (response1 && response1.errno === 0 && response1.data) ? response1.data.list || [] : [];
      const list4 = (response4 && response4.errno === 0 && response4.data) ? response4.data.list || [] : [];
      const combinedList = [...list1, ...list4];
      
      // 查找是否包含目标任务 - 同时检查 taskID 和 clueID
      const foundTask = combinedList.find(item => {
        let matchByTaskId = false;
        let matchByClueId = false;
        
        if (taskInfo.hasTaskId) {
          matchByTaskId = item.taskID === taskInfo.taskId;
        }
        
        if (taskInfo.hasClueId) {
          matchByClueId = item.clueID === taskInfo.clueId;
        }
        
        // 如果两个ID都有，必须都匹配；如果只有一个，匹配一个即可
        if (taskInfo.hasTaskId && taskInfo.hasClueId) {
          return matchByTaskId && matchByClueId;
        } else {
          return matchByTaskId || matchByClueId;
        }
      });
      
      if (foundTask) {
        console.log(`✅ 找到任务在第 ${page} 页:`, {
          taskID: foundTask.taskID,
          clueID: foundTask.clueID,
          searchCriteria: taskInfo
        });
        return page;
      }
    } catch (error) {
      console.error(`❌ 检查第 ${page} 页时出错:`, error);
    }
  }
  
  console.log(`📋 未找到匹配的任务在任何页面中，将显示第一页所有数据`, taskInfo);
  return null;
}

// 导航到包含当前任务的页面
async function navigateToCurrentTask() {
  const currentTaskInfo = getCurrentTaskInfo();
  if (!currentTaskInfo.hasTaskId && !currentTaskInfo.hasClueId) {
    console.log('📋 未检测到 taskid 或 clueID 参数，显示第一页数据');
    loadTableData(1);
    return;
  }
  
  console.log(`🎯 尝试导航到包含任务的页面`, currentTaskInfo);
  
  // 检查当前页面是否已包含该任务
  if (highlightCurrentTask(currentTaskInfo)) {
    console.log('✅ 当前任务已在当前页面中');
    return;
  }
  
  // 查找任务所在页面
  const targetPage = await findCurrentTaskPage(currentTaskInfo);
  if (targetPage && targetPage !== currentPage) {
    console.log(`🔄 导航到第 ${targetPage} 页`);
    await loadTableData(targetPage);
  } else if (!targetPage) {
    console.log('📋 当前任务不在任何页面中，显示第一页所有数据');
    // 未找到匹配任务时，显示第一页的所有数据
    await loadTableData(1);
  }
}

// 将关键函数暴露到全局作用域，确保可以在HTML中调用
window.closeDrawer = closeDrawer;
window.refreshData = refreshData;
window.goToNextQuestion = goToNextQuestion;
window.changePage = changePage;
window.auditTask = auditTask;
window.loadTableData = loadTableData;
window.toggleDrawer = toggleDrawer;
window.openDrawer = openDrawer;
window.removeDrawerElements = removeDrawerElements;
window.checkURLAndAddDrawerButton = checkURLAndAddDrawerButton;
window.selectQuestion = selectQuestion;
window.getCurrentTaskId = getCurrentTaskId;
window.getCurrentClueId = getCurrentClueId;
window.getCurrentTaskInfo = getCurrentTaskInfo;
window.highlightCurrentTask = highlightCurrentTask;
window.navigateToCurrentTask = navigateToCurrentTask;
window.findCurrentTaskPage = findCurrentTaskPage;
window.adjustTableHeight = adjustTableHeight;

console.log('✅ 抽屉模块函数已添加到全局作用域'); 

// 导出模块函数 - 用于ES6模块导入
export {
  checkURLAndAddDrawerButton,
  toggleDrawer,
  openDrawer,
  closeDrawer,
  removeDrawerElements,
  getCurrentTaskId,
  getCurrentClueId,
  getCurrentTaskInfo,
  highlightCurrentTask,
  navigateToCurrentTask,
  findCurrentTaskPage
};