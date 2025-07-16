import React, { useState, useEffect, useRef } from 'react';
import { content_review } from '../lib.js'; // 导入content_review函数
import { CozeService } from '../coze.js'; // 导入CozeService

const AuditComponent = ({ host, uname, serverType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [auditResults, setAuditResults] = useState('');
  const [thinkingChain, setThinkingChain] = useState('');
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connected'); // 添加连接状态
  const [cozeService, setCozeService] = useState(null); // 添加cozeService状态
  const portRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 2000; // 2秒

  // 初始化CozeService当服务器类型为"扣子"时
  useEffect(() => {
    console.log('CozeService useEffect triggered, serverType:', serverType);
    if (serverType === "扣子") {
      chrome.storage.sync.get(['kouziAccessKey', 'kouziReviewWorkflowId', 'kouziAppId'], (result) => {
        console.log('Kouzi configuration loaded:', result);
        if (result.kouziAccessKey && result.kouziReviewWorkflowId && result.kouziAppId) {
          console.log('All Kouzi config present, initializing CozeService');
          setCozeService(new CozeService(result.kouziAccessKey));
        } else {
          console.error('Missing required Kouzi configuration for audit:', {
            hasAccessKey: !!result.kouziAccessKey,
            hasReviewWorkflowId: !!result.kouziReviewWorkflowId,
            hasAppId: !!result.kouziAppId
          });
          // Optionally show an error message to the user
        }
      });
    } else {
      console.log('Server type is not 扣子, clearing cozeService');
      setCozeService(null);
    }
  }, [serverType]);

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

  const startContentReview = async (text) => {
    if (!text) return;

    setIsLoading(true);
    console.log('startContentReview called with serverType:', serverType, 'cozeService:', cozeService);

    // 判断服务器类型
    if (serverType === "扣子") {
      // 如果cozeService为null，尝试重新初始化
      let currentCozeService = cozeService;
      if (!currentCozeService) {
        console.log('cozeService is null, attempting to reinitialize...');
        const config = await new Promise((resolve) => {
          chrome.storage.sync.get(['kouziAccessKey', 'kouziReviewWorkflowId', 'kouziAppId'], resolve);
        });

        if (config.kouziAccessKey && config.kouziReviewWorkflowId && config.kouziAppId) {
          currentCozeService = new CozeService(config.kouziAccessKey);
          setCozeService(currentCozeService);
          console.log('CozeService reinitialized successfully');
        } else {
          console.error('Cannot reinitialize CozeService, missing config:', config);
          setAuditResults('扣子配置不完整，请检查设置页面');
          setIsLoading(false);
          return;
        }
      }

      if (currentCozeService) {
      try {
        // 读取审核工作流ID
        const result = await new Promise((resolve) => {
          chrome.storage.sync.get(['kouziReviewWorkflowId', 'kouziAppId'], resolve);
        });

        if (!result.kouziReviewWorkflowId || !result.kouziAppId) {
          throw new Error('缺少扣子审核工作流配置');
        }

        // 清空之前的结果，准备接收流式数据
        setAuditResults('');
        setThinkingChain('');

        // 调用扣子工作流（流式）
        await currentCozeService.executeWorkflowStream(result.kouziReviewWorkflowId, {
          app_id: result.kouziAppId,
          parameters: {
            text: text,
          }
        }, (streamData) => {
          // 处理流式数据
          try {
            // 检查是否是结束标志
            if (streamData === "[DONE]") {
              console.log("收到扣子工作流结束标志 [DONE]");
              return;
            }

            // 忽略 SSE 的 "event: Done" 事件
            if (typeof streamData === 'string' && streamData.includes('event: Done')) {
              console.log("忽略 SSE event: Done 事件");
              return;
            }

            // 处理不同格式的流式数据
            if (streamData && streamData.data) {
              // 忽略 data 字段中包含 "event: Done" 的数据
              if (typeof streamData.data === 'string' && streamData.data.includes('event: Done')) {
                console.log("忽略 data 中的 event: Done 事件");
                return;
              }

              // 如果有data字段，尝试解析
              try {
                const parsedData = typeof streamData.data === 'string'
                  ? JSON.parse(streamData.data)
                  : streamData.data;

                if (parsedData && parsedData.type === "reasoning") {
                  // 思维链数据
                  const text = parsedData.text || '';
                  setThinkingChain(prev => prev + text);
                } else if (parsedData && parsedData.result) {
                  // 审核结果数据
                  setAuditResults(prev => prev + parsedData.result);
                } else {
                  // 其他数据，追加到审核结果
                  const text = parsedData.text || parsedData.content || streamData.data;
                  setAuditResults(prev => prev + text);
                }
              } catch (parseError) {
                // 解析失败时，再次检查是否包含 "event: Done"
                if (typeof streamData.data === 'string' && streamData.data.includes('event: Done')) {
                  console.log("解析失败时忽略 event: Done 事件");
                  return;
                }
                // 解析失败，直接追加原始数据
                setAuditResults(prev => prev + streamData.data);
              }
            } else if (streamData) {
              // 直接处理streamData
              try {
                const parsedData = typeof streamData === 'string'
                  ? JSON.parse(streamData)
                  : streamData;

                if (parsedData.type === "reasoning") {
                  // 思维链数据
                  const text = parsedData.text || '';
                  setThinkingChain(prev => prev + text);
                } else {
                  // 常规内容数据
                  const text = parsedData.text || parsedData.content || '';
                  setAuditResults(prev => prev + text);
                }
              } catch (parseError) {
                // 无法解析为JSON，作为普通文本处理
                const dataToAppend = typeof streamData === 'string' ? streamData : JSON.stringify(streamData);
                setAuditResults(prev => prev + dataToAppend);
              }
            }
          } catch (error) {
            console.error('处理扣子流式数据时出错:', error);
            // 出错时也尝试显示数据，但先检查是否包含 "event: Done"
            const dataToAppend = typeof streamData === 'string' ? streamData : JSON.stringify(streamData);
            if (!dataToAppend.includes('event: Done')) {
              setAuditResults(prev => prev + dataToAppend);
            }
          }
        });
      } catch (error) {
        console.error("扣子审核工作流出错:", error);
        setAuditResults('审核过程中出错: ' + (error.message || "未知错误"));
      } finally {
        setIsLoading(false);
      }
      }
    } else {
      // 直接调用content_review函数 - 使用Sidebar的消息格式处理方式
      content_review(
        text,
        host,
        uname,
        // 消息处理器 - 使用Sidebar的格式
        (eventData) => {
          try {
            // 检查是否是结束标志 [DONE]
            if (eventData === "[DONE]") {
              console.log("收到审核流结束标志 [DONE]");
              setIsLoading(false);
              return;
            }

            // 使用Sidebar的type字段解析方式
            let data;
            try {
              data = JSON.parse(eventData);
            } catch (e) {
              // 如果不是JSON格式，当作普通文本处理
              if (eventData.trim() !== '[DONE]') {
                setAuditResults(prev => prev + eventData);
              }
              return;
            }

            // 使用Sidebar的type字段解析方式
            if (data.type === 'reasoning') {
              // 思维链数据 - 保留换行符
              setThinkingChain(prev => prev + (data.text || ''));
            } else if (data.type === 'content') {
              // 主要内容数据 - 保留换行符
              setAuditResults(prev => prev + (data.text || ''));
            } else {
              // **修复：即使是非type格式的JSON，也当作内容处理，避免未解析JSON**
              const text = data.text || data.content || data.result || JSON.stringify(data);
              if (text) {
                setAuditResults(prev => prev + text);
              }
            }
          } catch (e) {
            console.error('解析审核数据时出错:', e);
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
    }
  };

  const handleAuditCheck = async () => {
    // 清空之前的结果
    setAuditResults('');
    setThinkingChain(''); // 清空思维链

    // 如果是扣子服务器，也需要重新提取页面内容
    if (serverType === "扣子") {
      // 每次都重新提取页面内容，不使用缓存的extractedText
      if (!portRef.current) {
        setAuditResults('连接已断开，无法提取页面内容，请刷新页面重试');
        return;
      }
      try {
        portRef.current.postMessage({
          action: "start_audit_check"
        });
        return;
      } catch (error) {
        setAuditResults('提取页面内容失败：' + error.message);
        return;
      }
    }

    // 官方服务器需要通过background.js
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
              <h3 className="text-xs font-medium text-purple-800">审核内容</h3>
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
