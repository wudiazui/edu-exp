import React, { useState, useEffect, useRef } from 'react';
import CopyButton from './CopyButton.jsx';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { user_info } from '../lib.js';

const QuestionSearchComponent = ({ host, uname, serverType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState('');
  const [thinkingChain, setThinkingChain] = useState('');
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [questionContent, setQuestionContent] = useState('');
  const [answerContent, setAnswerContent] = useState('');
  const [searchResponse, setSearchResponse] = useState(null);
  const [renderedQuestionHtml, setRenderedQuestionHtml] = useState('');
  const [renderedAnswerHtml, setRenderedAnswerHtml] = useState('');
  const portRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 2000; // 2秒
  
  // 辅助函数：清理HTML内容，保留纯文本
  const cleanHtmlContent = (htmlContent) => {
    if (!htmlContent) return '';
    // 创建一个临时div元素来解析HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // 使用 KaTeX 渲染数学公式
  const renderMathWithKaTeX = (content) => {
    if (!content) return '';
    
    let result = content;
    
    try {
      // 处理行内数学公式 $...$
      result = result.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
        try {
          const html = katex.renderToString(formula.trim(), {
            throwOnError: false,
            displayMode: false
          });
          return html;
        } catch (error) {
          console.error('行内公式渲染错误:', error);
          return `<span style="color:red;">$${formula}$</span>`;
        }
      });
      
      // 处理块级数学公式 $$...$$
      result = result.replace(/\$\$([^$]+?)\$\$/g, (match, formula) => {
        try {
          const html = katex.renderToString(formula.trim(), {
            throwOnError: false,
            displayMode: true
          });
          return `<div style="text-align: center; margin: 10px 0;">${html}</div>`;
        } catch (error) {
          console.error('块级公式渲染错误:', error);
          return `<div style="color:red; text-align: center;">$$${formula}$$</div>`;
        }
      });
      
      // 处理 \(...\) 格式的行内公式
      result = result.replace(/\\\(([^)]+?)\\\)/g, (match, formula) => {
        try {
          const html = katex.renderToString(formula.trim(), {
            throwOnError: false,
            displayMode: false
          });
          return html;
        } catch (error) {
          console.error('行内公式渲染错误:', error);
          return `<span style="color:red;">\\(${formula}\\)</span>`;
        }
      });
      
      // 处理 \[...\] 格式的块级公式
      result = result.replace(/\\\[([^\\]+?)\\\]/g, (match, formula) => {
        try {
          const html = katex.renderToString(formula.trim(), {
            throwOnError: false,
            displayMode: true
          });
          return `<div style="text-align: center; margin: 10px 0;">${html}</div>`;
        } catch (error) {
          console.error('块级公式渲染错误:', error);
          return `<div style="color:red; text-align: center;">\\[${formula}\\]</div>`;
        }
      });
      
    } catch (error) {
      console.error('数学公式渲染总体错误:', error);
      return content; // 返回原始内容
    }
    
    return result;
  };

  // 渲染问题内容
  useEffect(() => {
    if (questionContent) {
      const rendered = renderMathWithKaTeX(questionContent);
      setRenderedQuestionHtml(rendered);
    } else {
      setRenderedQuestionHtml('');
    }
  }, [questionContent]);

  // 渲染答案内容
  useEffect(() => {
    if (answerContent) {
      const rendered = renderMathWithKaTeX(answerContent);
      setRenderedAnswerHtml(rendered);
    } else {
      setRenderedAnswerHtml('');
    }
  }, [answerContent]);

  // 设置与background.js的长连接
  useEffect(() => {
    // 创建与background.js的长连接的函数
    const setupConnection = () => {
      try {
        const port = chrome.runtime.connect({ name: 'question-search-channel' });
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
          } else if (message.action === "question_search_result" && message.data) {
            console.log('question search result:', message.data);
            setSearchResults(message.data);
            
            // 解析搜索响应数据
            try {
              const responseData = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
              setSearchResponse(responseData);
              
              // 提取问题内容
              if (responseData.question && responseData.question.content) {
                setQuestionContent(responseData.question.content);
              } else {
                console.warn('搜索响应中未找到问题内容');
              }
              
              // 提取答案内容
              if (responseData.answer && Array.isArray(responseData.answer) && responseData.answer.length > 0 && responseData.answer[0].content) {
                setAnswerContent(responseData.answer[0].content);
              } else {
                console.warn('搜索响应中未找到答案内容');
              }
            } catch (error) {
              console.error('解析搜索响应数据失败:', error);
              // 如果JSON解析失败，显示原始数据
              setSearchResults(message.data);
            }
            
            setIsLoading(false);
          } else if (message.action === "question_search_loading_state") {
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
            setSearchResults(prev => prev + '\n\n连接已断开，请刷新页面重试。');
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

  const handleQuestionSearch = async () => {
    // 立即设置加载状态，提供即时反馈
    setIsLoading(true);
    
    // 清空之前的结果
    setSearchResults('');
    setThinkingChain(''); // 清空思维链
    setQuestionContent('');
    setAnswerContent('');
    setSearchResponse(null);
    setRenderedQuestionHtml('');
    setRenderedAnswerHtml('');

    if (!portRef.current) {
      console.error('未建立与background的连接');
      setSearchResults('连接已断开，请刷新页面重试');
      setIsLoading(false); // 重置加载状态
      return;
    }

    // 验证用户信息
    try {
      console.log('开始验证用户信息...');
      const userInfo = await user_info(host, uname);
      
      if (!userInfo) {
        setSearchResults('用户信息验证失败，请检查服务器地址和用户名');
        setIsLoading(false); // 重置加载状态
        return;
      }

      // 检查搜索权限：账户未过期 OR coze权限为true（满足其中一个即可）
      let hasValidAccess = false;
      let errorMessage = '';

      // 检查账户是否过期
      let isAccountValid = false;
      if (userInfo.exp_time) {
        const expTime = new Date(userInfo.exp_time);
        const currentTime = new Date();
        isAccountValid = currentTime <= expTime;
        if (!isAccountValid) {
          errorMessage += '账户已过期；';
        }
      }

      // 检查 coze 权限
      const hasCozePermission = userInfo.coze === true;
      if (!hasCozePermission) {
        errorMessage += '未开通搜索功能权限；';
      }

      // 只要满足其中一个条件即可
      hasValidAccess = isAccountValid || hasCozePermission;

      if (!hasValidAccess) {
        setSearchResults(`搜索功能不可用：${errorMessage}请续费或联系管理员开通权限`);
        setIsLoading(false); // 重置加载状态
        return;
      }

      console.log('用户信息验证通过，开始搜索...');
    } catch (error) {
      console.error('用户信息验证失败:', error);
      setSearchResults('用户信息验证失败：' + error.message);
      setIsLoading(false); // 重置加载状态
      return;
    }

    // 清空之前的结果，但不设置加载状态（会由background.js通过消息通知）
    setSearchResults('');
    setThinkingChain(''); // 清空思维链
    setQuestionContent('');
    setAnswerContent('');
    setSearchResponse(null);
    setRenderedQuestionHtml('');
    setRenderedAnswerHtml('');

    try {
      // 通过长连接发送消息
      portRef.current.postMessage({
        action: "start_question_search"
      });
    } catch (error) {
      console.error('题干搜索请求出错:', error);
      setSearchResults('搜索失败：' + error.message);
      setIsLoading(false); // 确保重置加载状态

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
        const port = chrome.runtime.connect({ name: 'question-search-channel' });
        portRef.current = port;
        setConnectionStatus('connected');
      }
    }
  };

  return (
    <div className="container mx-auto px-1 mt-2">
      <div className="">
        <div className="mb-2">
          <button
            className={`btn btn-sm w-full btn-primary ${isLoading ? 'opacity-90' : ''} relative`}
            onClick={handleQuestionSearch}
            disabled={isLoading || connectionStatus !== 'connected'}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs mr-2"></span>
                <span className="text-xs">搜索中</span>
              </>
            ) : connectionStatus !== 'connected' ? '连接已断开' : '开始搜索'}

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

        {/* 问题内容显示区域 */}
        {questionContent && (
          <div className="mb-3 p-4 bg-blue-50 rounded-lg shadow-sm border border-blue-200">
            <div className="flex justify-between items-center pb-2 border-b border-blue-200">
              <h3 className="text-md font-medium text-blue-800">题目</h3>
              <div className="flex gap-1 items-center">
                <button
                  onClick={() => {
                    chrome.runtime.sendMessage({
                      type: "question_html",
                      text: questionContent
                    });
                  }}
                  className="btn btn-xs btn-outline flex items-center gap-1"
                >
                  填入
                </button>
                <CopyButton text={questionContent} />
              </div>
            </div>
            <div 
              className="text-sm leading-relaxed mt-2 text-gray-700 overflow-auto prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderedQuestionHtml || questionContent }}
            />
          </div>
        )}

        {/* 答案内容显示区域 */}
        {answerContent && (
          <div className="mb-3 p-4 bg-green-50 rounded-lg shadow-sm border border-green-200">
            <div className="flex justify-between items-center pb-2 border-b border-green-200">
              <h3 className="text-md font-medium text-green-800">解答</h3>
              <CopyButton text={answerContent} />
            </div>
            <div 
              className="text-sm leading-relaxed mt-2 text-gray-700 overflow-auto prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderedAnswerHtml || answerContent }}
            />
          </div>
        )}

        {/* 原始搜索结果（可选显示，用于调试） */}
        {searchResults && !questionContent && !answerContent && (
          <div className="mb-3 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-md font-medium mb-3 pb-2 border-b border-gray-200 text-purple-800">搜索结果</h3>
            <div className="whitespace-pre-wrap text-sm leading-relaxed mt-2 text-gray-700 overflow-auto">
              {searchResults.trim()}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default QuestionSearchComponent;
