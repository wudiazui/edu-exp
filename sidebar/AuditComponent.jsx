import React, { useState, useEffect, useRef } from 'react';
import { content_review } from '../lib.js'; // 导入content_review函数

const AuditComponent = ({ host, uname, serverType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [auditResults, setAuditResults] = useState('');
  const [thinkingChain, setThinkingChain] = useState('');
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [displayMode, setDisplayMode] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connected'); // 添加连接状态
  const portRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 2000; // 2秒

  // 设置与background.js的长连接
  useEffect(() => {
    // 创建与background.js的长连接的函数
    const setupConnection = () => {
      try {
        const port = chrome.runtime.connect({ name: 'audit-content-channel' });
        portRef.current = port;
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0; // 重置重连尝试次数

        // 处理从background.js接收的消息
        port.onMessage.addListener((message) => {
          if (!message || typeof message !== 'object') {
            console.error('收到无效消息格式');
            return;
          }

          if (message.action === "heartbeat_response") {
            // 收到心跳响应，连接正常
            setConnectionStatus('connected');
          } else if (message.action === "audit_content_result" && message.html) {
            console.log('message.html', message.html);
            setAuditResults(message.html);
            setIsLoading(false);
          } else if (message.action === "audit_content_extract" && message.html) {
            setExtractedText(message.html);
            setAuditResults(''); // 重置结果
            setThinkingChain(''); // 重置思维链
            startContentReview(message.html);
          } else if (message.action === "audit_loading_state") {
            // 处理加载状态更新
            setIsLoading(message.isLoading);
          }
        });

        // 处理连接断开
        port.onDisconnect.addListener(() => {
          console.log('与background的连接已断开');
          setConnectionStatus('disconnected');
          portRef.current = null;
          
          // 尝试重新连接，除非已达到最大尝试次数
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            console.log(`尝试重新连接 (${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++;
              setupConnection();
            }, RECONNECT_DELAY);
          } else {
            console.error('达到最大重连次数，停止重连');
            setAuditResults(prev => prev + '\n\n连接已断开，请刷新页面重试。');
          }
        });
      } catch (error) {
        console.error('建立连接失败:', error);
        setConnectionStatus('disconnected');
        
        // 尝试重新连接，除非已达到最大尝试次数
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            setupConnection();
          }, RECONNECT_DELAY);
        }
      }
    };

    // 初始建立连接
    setupConnection();

    // 设置心跳检测
    const heartbeatInterval = setInterval(() => {
      if (portRef.current) {
        try {
          portRef.current.postMessage({ action: "heartbeat" });
        } catch (e) {
          console.error('心跳发送失败，连接可能已断开', e);
          setConnectionStatus('disconnected');
          // 连接可能已断开，但onDisconnect尚未触发，主动断开并重新连接
          if (portRef.current) {
            try {
              portRef.current.disconnect();
            } catch (err) {
              console.error('断开连接失败:', err);
            }
            portRef.current = null;
          }
          
          // 尝试重新连接
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++;
              setupConnection();
            }, RECONNECT_DELAY);
          }
        }
      }
    }, 30000); // 30秒一次心跳

    // 组件卸载时清理
    return () => {
      clearInterval(heartbeatInterval);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (portRef.current) {
        try {
          portRef.current.disconnect();
        } catch (e) {
          console.error('断开连接失败:', e);
        }
        portRef.current = null;
      }
    };
  }, []);

  const startContentReview = (text) => {
    if (!text) return;
    
    setIsLoading(true);
    
    // 直接调用content_review函数
    content_review(
      text,
      host,
      uname,
      // 消息处理器
      (eventData) => {
        try {
          // 检查是否是结束标志 [DONE]
          if (eventData === "[DONE]") {
            console.log("收到审核流结束标志 [DONE]");
            return; // 不处理这个数据块，直接返回
          }
          
          // 尝试解析数据
          let data;
          
          try {
            data = JSON.parse(eventData);
            
            if (data.type === "reasoning") {
              // 思维链数据 - 保留换行符
              const text = data.text || '';
              setThinkingChain(prev => prev + text);
            } else {
              // 常规内容数据 - 保留换行符
              const text = data.text || data.content || '';
              setAuditResults(prev => prev + text);
            }
          } catch {
            // 无法解析为JSON，作为普通文本处理 - 保留换行符
            setAuditResults(prev => prev + eventData);
          }
        } catch (e) {
          console.error('处理审核数据时出错:', e);
        }
      },
      // 错误处理器
      (error) => {
        console.error("内容审核出错:", error);
        setAuditResults('审核过程中出错: ' + (error.message || "未知错误"));
        setIsLoading(false);
      },
      // 完成处理器
      () => {
        setIsLoading(false);
      }
    );
  };

  const handleAuditCheck = async () => {
    if (!portRef.current) {
      console.error('未建立与background的连接');
      setAuditResults('连接已断开，请刷新页面重试');
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
      
      // 连接可能已经断开，尝试重新连接
      setConnectionStatus('disconnected');
      if (portRef.current) {
        try {
          portRef.current.disconnect();
        } catch (e) {
          console.error('断开连接失败:', e);
        }
        portRef.current = null;
      }
      
      // 尝试重新连接
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++;
        const port = chrome.runtime.connect({ name: 'audit-content-channel' });
        portRef.current = port;
        setConnectionStatus('connected');
      }
    }
  };

  return (
    <div className="container mx-auto px-1 mt-2">
      <div className="px-2 pt-2 pb-3 mb-4">
        <div className="mb-2">
          <button 
            className={`btn btn-sm w-full btn-primary ${isLoading ? 'opacity-90' : ''} relative`}
            onClick={handleAuditCheck}
            disabled={isLoading || connectionStatus !== 'connected'}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs mr-2"></span>
                <span className="text-xs">审核中</span>
              </>
            ) : connectionStatus !== 'connected' ? '连接已断开' : '开始辅助审核检查'}
            
            {/* 连接状态指示器 - 放在按钮内容右侧 */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
              {connectionStatus === 'connected' ? 
                <span className="text-xs px-1.5 py-0.5 bg-green-200 text-green-900 rounded-full flex items-center ml-1">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-0.5"></span>
                  <span className="text-[10px]">正常</span>
                </span> : 
                <span className="text-xs px-1.5 py-0.5 bg-red-200 text-red-900 rounded-full flex items-center ml-1">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-0.5"></span>
                  <span className="text-[10px]">断开</span>
                </span>}
            </div>
          </button>
        </div>

        {/* 提取文本显示区域 - 可折叠 */}
        {extractedText && (
          <div className="mb-3 border rounded-lg overflow-hidden">
            <div 
              className="bg-base-200 p-1 flex justify-between items-center cursor-pointer"
              onClick={() => setIsTextExpanded(!isTextExpanded)}
            >
              <h3 className="text-xs font-medium">提取的文本内容</h3>
              <button className="btn btn-xs btn-ghost">
                {isTextExpanded ? (
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
            {isTextExpanded && (
              <div className="p-2 bg-base-100 border-t">
                <textarea
                  className="w-full h-48 p-2 border border-gray-300 rounded-md text-sm"
                  value={extractedText}
                  readOnly
                  style={{ resize: 'vertical' }}
                />
              </div>
            )}
          </div>
        )}

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