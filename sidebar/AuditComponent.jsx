import React, { useState, useEffect } from 'react';

const AuditComponent = ({ host, uname, serverType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [auditResults, setAuditResults] = useState('');

  useEffect(() => {
    // Listen for messages from background script
    const messageListener = (message) => {
      if (message.action === "audit_content_result" && message.html) {
        setAuditResults(message.html);
        setIsLoading(false);
      }
    };

    // Add listener
    chrome.runtime.onMessage.addListener(messageListener);

    // Clean up listener when component unmounts
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleAuditCheck = async () => {
    setIsLoading(true);
    try {
      // 添加3秒延迟
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 发送消息到background.js请求内容提取
      chrome.runtime.sendMessage({
        action: "start_audit_check"
      });
      
      // 实际内容将通过useEffect钩子中的消息监听器接收，
      // 该监听器会更新auditResults
    } catch (error) {
      console.error('Error during audit check:', error);
      setAuditResults('审核失败：' + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-1 mt-2">
      <div className="px-2 pt-2 pb-3 mb-4">
        
        <div className="mb-4">
          <button 
            className={`btn btn-sm w-full btn-primary ${isLoading ? 'opacity-90' : ''}`}
            onClick={handleAuditCheck}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs mr-2"></span>
                <span className="text-xs">审核中</span>
              </>
            ) : '开始辅助审核检查'}
          </button>
        </div>

        {auditResults && (
          <div className="mb-3 p-3 bg-gray-100 rounded-md">
            <h3 className="text-md font-medium mb-2">审核结果：</h3>
            <div className="whitespace-pre-wrap">{auditResults}</div>
          </div>
        )}

        <div className="text-sm text-gray-500 mt-2">
          <p>提示: AI 知识辅助审核，仅提供参考建议，最终审核结果需要人工校验确认。</p>
        </div>
      </div>
    </div>
  );
};

export default AuditComponent; 