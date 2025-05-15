import React, { useState, useEffect } from 'react';

const AuditComponent = ({ host, uname, serverType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [auditResults, setAuditResults] = useState('');

  useEffect(() => {
    // 监听来自 background.js 的消息
    const messageListener = (message) => {
      if (message.action === "audit_content_result" && message.html) {
        console.log('message.html', message.html);
        setAuditResults(message.html);
        setIsLoading(false);
      } else if (message.action === "audit_content_extract" && message.html) {
        // 当从编辑器提取完成后，只发送请求开始内容审核，不显示提取的内容
        startContentReview(message.html);
      } else if (message.action === "content_review_message") {
        // 处理流式响应消息
        try {
          const data = message.data;
          if (typeof data === 'string') {
            setAuditResults(prev => prev + data);
          } else if (data && data.content) {
            setAuditResults(prev => prev + data.content);
          }
        } catch (e) {
          console.error('处理审核消息出错:', e);
        }
      } else if (message.action === "content_review_error") {
        console.error('内容审核错误:', message.error);
        setAuditResults(prev => prev + '\n\n审核过程中出错: ' + message.error);
        setIsLoading(false);
      } else if (message.action === "content_review_complete") {
        setIsLoading(false);
      }
    };

    // 添加监听器
    chrome.runtime.onMessage.addListener(messageListener);

    // 组件卸载时清理监听器
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const startContentReview = (text) => {
    if (!text) return;
    
    // 向后台脚本发送消息，请求进行内容审核
    chrome.runtime.sendMessage({
      action: "start_content_review",
      text: text,
      host: host,
      uname: uname
    });
  };

  const handleAuditCheck = async () => {
    setIsLoading(true);
    setAuditResults('');
    
    try {
      // 请求从当前页面提取内容
      chrome.runtime.sendMessage({
        action: "start_audit_check"
      });
      
      // 内容将通过消息监听器接收处理
    } catch (error) {
      console.error('审核请求出错:', error);
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
          <div className="mb-3 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-md font-medium mb-3 pb-2 border-b border-gray-200 text-purple-800">审核结果</h3>
            
            
            <div className="whitespace-pre-wrap text-sm leading-relaxed mt-2 text-gray-700">
              {auditResults}
            </div>
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