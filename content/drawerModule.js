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
    
    // 调用API获取数据
    const response = await getMyAuditTaskList({
      pn: page,
      rn: pageSize,
      clueID: '',
      clueType: '',
      step: '',
      subject: '',
      state: 1
    });
    
    console.log('📡 API响应:', response);
    
    if (response && response.errno === 0 && response.data) {
      const { total, list } = response.data;
      
      // 更新分页信息
      totalRecords = total;
      totalPages = Math.ceil(total / pageSize);
      currentData = list || [];
      currentPage = page;
      
      console.log('📊 数据统计:', { totalRecords, totalPages, currentPage, dataLength: currentData.length });
      
      // 渲染数据
      if (currentData.length > 0) {
        tbody.innerHTML = currentData.map(item => `
          <tr class="hover:bg-base-200" data-task-id="${item.taskID}" data-clue-id="${item.clueID}">
            <td class="font-mono text-sm">${item.clueID}</td>
            <td class="font-medium max-w-xs truncate" title="${item.brief.replace(/\n/g, ' ')}">${item.brief.replace(/\n/g, ' ').substring(0, 50)}${item.brief.length > 50 ? '...' : ''}</td>
            <td class="text-sm">${item.stepName}</td>
            <td class="text-sm">${item.subjectName}</td>
            <td>
              <button class="btn btn-primary btn-sm" data-action="audit-task" data-task-id="${item.taskID}">
                审核
              </button>
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
      throw new Error(response?.errmsg || '数据格式错误');
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
  }
}

// 审核任务功能
function auditTask(taskID) {
  console.log('审核任务:', taskID);
  
  // 修改当前访问路径
  const newPath = `/edu-shop-web/#/question-task/audit-pool-edit?taskid=${taskID}`;
  
  // 更新浏览器地址栏
  window.history.pushState({}, '', newPath);
  
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
  
  setTimeout(() => {
    toast.remove();
    // 这里可以添加实际的页面跳转逻辑或触发页面重新加载
    console.log(`已跳转到审核页面: ${newPath}`);
    
    // 如果需要实际重新加载页面，可以使用：
    // window.location.href = newPath;
  }, 1500);
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
  
  // 高亮选中的行
  const rows = document.querySelectorAll('#data-table-body tr');
  rows.forEach(row => row.classList.remove('bg-primary', 'text-primary-content'));
  
  // 通过data属性查找对应的行
  const selectedRow = document.querySelector(`#data-table-body tr[data-task-id="${taskId}"]`);
  if (selectedRow) {
    selectedRow.classList.add('bg-primary', 'text-primary-content');
  }
  
  // 更新下一题按钮状态
  const nextButton = document.querySelector('.btn-primary.btn-wide');
  if (nextButton) {
    nextButton.textContent = `处理任务 ${taskId} →`;
    nextButton.classList.remove('btn-disabled');
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
      title: '题目数据面板',
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
  overlay.addEventListener('click', closeDrawer);
  
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
    z-index: 100001 !important;
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
  
  // 更新时间
  updateLastUpdateTime();
}

// 创建抽屉头部
function createDrawerHeader(config) {
  const header = document.createElement('div');
  header.className = 'card-header flex items-center justify-between p-4 border-b border-base-300';
  header.innerHTML = `
    <div class="w-1 h-12 bg-base-300 rounded-full absolute top-1/2 left-2 transform -translate-y-1/2"></div>
    <h3 class="card-title text-lg font-bold text-primary">${config.title || '数据面板'}</h3>
    <button class="btn btn-sm btn-circle btn-ghost hover:btn-error" data-action="close-drawer">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  body.className = 'card-body p-4 flex flex-col h-full';
  
  // 创建 Tab 导航
  const tabNav = document.createElement('div');
  tabNav.className = 'tabs tabs-bordered mb-4';
  tabNav.innerHTML = `
    <a class="tab tab-active" data-tab="data">数据表格</a>
  `;
  
  // 创建 Tab 内容容器
  const tabContent = document.createElement('div');
  tabContent.className = 'tab-content flex-1 flex flex-col';
  
  // 数据表格 Tab
  const dataTab = createDataTab();
  dataTab.className = 'tab-pane active flex-1 flex flex-col';
  dataTab.id = 'tab-data';
  
  tabContent.appendChild(dataTab);
  
  body.appendChild(tabNav);
  body.appendChild(tabContent);
  
  // 添加 Tab 切换事件
  addTabEvents(tabNav);
  
  return body;
}

// 创建数据表格 Tab
function createDataTab() {
  const container = document.createElement('div');
  
  // 数据统计信息
  const statsContainer = document.createElement('div');
  statsContainer.className = 'flex justify-between items-center mb-4 text-sm text-gray-600';
  statsContainer.innerHTML = `
    <div id="data-stats">
      总计: <span id="total-records">0</span> 条记录
    </div>
    <button class="btn btn-sm btn-ghost" data-action="refresh-data" title="刷新数据">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  tableContainer.className = 'overflow-x-auto flex-1 mb-4';
  
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
  
  // 翻页按钮组
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'flex justify-center mb-4';
  
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
  container.appendChild(paginationContainer);
  container.appendChild(nextButtonContainer);
  
  // 延迟初始化表格数据，确保API函数已经初始化
  setTimeout(() => {
    loadTableData(1);
  }, 100);
  
  return container;
}

// 更新数据统计信息
function updateDataStats() {
  const totalRecordsElement = document.getElementById('total-records');
  if (totalRecordsElement) {
    totalRecordsElement.textContent = totalRecords;
  }
}

// 添加 Tab 切换事件
function addTabEvents(tabNav) {
  const tabs = tabNav.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      
      // 移除所有活动状态
      tabs.forEach(t => t.classList.remove('tab-active'));
      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.add('hidden');
        pane.classList.remove('active');
      });
      
      // 添加当前活动状态
      tab.classList.add('tab-active');
      const targetTab = document.getElementById(`tab-${tab.dataset.tab}`);
      if (targetTab) {
        targetTab.classList.remove('hidden');
        targetTab.classList.add('active');
      }
    });
  });
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
  
  // 更新按钮状态
  const button = document.getElementById('drawer-float-button');
  if (button) {
    button.classList.add('active');
    button.style.transform = 'scale(1.05) rotate(45deg)';
  }
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
      z-index: 100001 !important;
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
      pointer-events: auto !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
    }
    
    #drawer-float-button:hover {
      cursor: pointer !important;
    }
    
    /* 表格滚动优化 - 补充DaisyUI */
    .overflow-x-auto {
      scrollbar-width: thin;
      scrollbar-color: rgba(0,0,0,0.2) transparent;
    }
    
    .overflow-x-auto::-webkit-scrollbar {
      height: 6px;
    }
    
    .overflow-x-auto::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .overflow-x-auto::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.2);
      border-radius: 3px;
    }
    
    .overflow-x-auto::-webkit-scrollbar-thumb:hover {
      background: rgba(0,0,0,0.3);
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

// 导出模块函数
export {
  checkURLAndAddDrawerButton,
  toggleDrawer,
  openDrawer,
  closeDrawer,
  removeDrawerElements
}; 

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

console.log('✅ 抽屉模块函数已添加到全局作用域'); 