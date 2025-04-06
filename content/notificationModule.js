// notificationModule.js - 通知系统模块

// 添加通知系统
function showNotification(message, type = 'info', isLoading = false) {
  const notificationId = 'notification-' + Date.now();
  const notification = document.createElement('div');
  notification.id = notificationId;
  notification.className = `notification notification-${type}`;

  // Add loading spinner if needed
  if (isLoading) {
    notification.innerHTML = `
      <div class="notification-spinner"></div>
      <span>${message}</span>
    `;
  } else {
    notification.innerHTML = `<span>${message}</span>`;
  }

  // Add notification styles if not already added
  if (!document.getElementById('notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 15px;
        border-radius: 4px;
        color: white;
        font-size: 14px;
        z-index: 10000;
        display: flex;
        align-items: center;
        animation: slideIn 0.3s ease forwards;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      }
      .notification-info {
        background-color: #2196F3;
      }
      .notification-success {
        background-color: #4CAF50;
      }
      .notification-warning {
        background-color: #FF9800;
      }
      .notification-error {
        background-color: #F44336;
      }
      .notification-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: white;
        margin-right: 10px;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styles);
  }

  document.body.appendChild(notification);

  // Auto hide non-loading notifications
  if (!isLoading) {
    setTimeout(() => hideNotification(notificationId), 3000);
  }

  return notificationId;
}

// 隐藏通知
function hideNotification(notificationId) {
  const notification = document.getElementById(notificationId);
  if (notification) {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }
}

// 导出模块函数
export {
  showNotification,
  hideNotification
};
