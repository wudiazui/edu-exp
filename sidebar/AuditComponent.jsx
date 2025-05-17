import React, { useState, useEffect, useRef } from 'react';

const AuditComponent = ({ host, uname, serverType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [auditResults, setAuditResults] = useState('');
  const [thinkingChain, setThinkingChain] = useState('');
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [displayMode, setDisplayMode] = useState(false);
  const portRef = useRef(null);

  // 设置与background.js的长连接
  useEffect(() => {
    // 创建与background.js的长连接
    const port = chrome.runtime.connect({ name: 'audit-content-channel' });
    portRef.current = port;

    // 处理从background.js接收的消息
    port.onMessage.addListener((message) => {
      if (message.action === "audit_content_result" && message.html) {
        console.log('message.html', message.html);
        setAuditResults(message.html);
        setIsLoading(false);
      } else if (message.action === "audit_content_extract" && message.html) {
        setAuditResults(''); // 重置结果
        setThinkingChain(''); // 重置思维链
        startContentReview(message.html);
      } else if (message.action === "content_review_message") {
        try {
          const data = message.data;
          
          // 处理新格式的响应数据
          if (typeof data === 'object' && data !== null) {
            if (data.type === "reasoning") {
              // 思维链数据 - 保留换行符
              const text = data.text || '';
              setThinkingChain(prev => prev + text);
            } else {
              // 常规内容数据 - 保留换行符
              const text = data.text || data.content || '';
              setAuditResults(prev => prev + text);
            }
          } else if (typeof data === 'string') {
            // 尝试解析字符串，可能是JSON格式
            try {
              const parsedData = JSON.parse(data);
              if (parsedData.type === "reasoning") {
                // 保留换行符
                const text = parsedData.text || '';
                setThinkingChain(prev => prev + text);
              } else {
                // 保留换行符
                const text = parsedData.text || parsedData.content || '';
                setAuditResults(prev => prev + text);
              }
            } catch {
              // 无法解析为JSON，作为普通文本处理 - 保留换行符
            setAuditResults(prev => prev + data);
            }
          }
        } catch (e) {
          console.error('处理审核消息出错:', e);
        }
      } else if (message.action === "content_review_error") {
        console.error('内容审核错误:', message.error);
        setAuditResults('审核过程中出错: ' + message.error);
        setIsLoading(false);
      } else if (message.action === "content_review_complete") {
        setIsLoading(false);
      } else if (message.action === "audit_loading_state") {
        // 处理加载状态更新
        setIsLoading(message.isLoading);
      }
    });

    // 处理连接断开
    port.onDisconnect.addListener(() => {
      console.log('与background的连接已断开');
      portRef.current = null;
    });

    // 组件卸载时断开连接
    return () => {
      if (portRef.current) {
        portRef.current.disconnect();
        portRef.current = null;
      }
    };
  }, []);

  const startContentReview = (text) => {
    if (!text || !portRef.current) return;
    
    // 通过长连接发送消息
    portRef.current.postMessage({
      action: "start_content_review",
      text: text,
      host: host,
      uname: uname
    });
  };

  const handleAuditCheck = async () => {
    if (!portRef.current) {
      console.error('未建立与background的连接');
      return;
    }

    // 清空之前的结果，但不设置加载状态（会由background.js通过消息通知）
    setAuditResults('');
    setThinkingChain(''); // 清空思维链
    
    try {
      // 通过长连接发送消息
      portRef.current.postMessage({
        action: "start_audit_check"
      });
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

        {/* 思维链显示区域 */}
        {thinkingChain && (
          <div className="mb-1 border rounded-lg overflow-hidden text-xs">
            <div 
              className="bg-base-200 p-1 flex justify-between items-center cursor-pointer"
              onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            >
              <h3 className="text-xs font-medium">思考过程</h3>
              <button className="btn btn-xs btn-ghost">
                {isThinkingExpanded ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>
            {isThinkingExpanded && (
              <div className="p-2 bg-base-100 text-xs border-t whitespace-pre-wrap">
                {thinkingChain}
              </div>
            )}
          </div>
        )}

        {auditResults && (
          <div className="mb-3 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-md font-medium mb-3 pb-2 border-b border-gray-200 text-purple-800">审核结果</h3>
            <div className="whitespace-pre-wrap text-sm leading-relaxed mt-2 text-gray-700 overflow-auto">
              {auditResults.trim()}
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