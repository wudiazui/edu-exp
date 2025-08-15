import React, { useState, useEffect, useMemo, useRef } from "react";
import ApiSettingsForm from './ApiSettingsForm'; // 引入新组件
import QuestionAnswerForm from './QuestionAnswerForm'; // 引入新组件
import OcrComponent from './OcrComponent'; // 引入新组件
import ClueClaimingComponent from './ClueClaimingComponent'; // 引入线索认领组件
import TopicSplitComponent from './TopicSplitComponent'; // 引入题目切割组件
import FeedbackComponent from './FeedbackComponent'; // 引入问题反馈组件
import DocumentationComponent from './DocumentationComponent'; // 引入文档组件
import DocuScanComponent from './DocuScanComponent'; // 引入DocuScan组件
import MobileWebComponent from './MobileWebComponent'; // 引入手机网页端组件
import AuditComponent from './AuditComponent'; // 引入审核组件
import WorkflowComponent from './WorkflowComponent'; // 引入工作流组件
import QuestionSearchComponent from './QuestionSearchComponent'; // 引入题干搜索组件
import { CozeService } from '../coze.js';
// 从lib.js导入需要的网络请求函数
import { run_llm, run_llm_stream, ocr_text, topic_split, content_review, format_latex } from '../lib.js';
// 导入文本处理函数
import { removeEmptyLinesFromString } from '../text.js';

export default function Main() {
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [analysis, setAnalysis] = React.useState('');
  const [answerThinkingChain, setAnswerThinkingChain] = React.useState('');
  const [analysisThinkingChain, setAnalysisThinkingChain] = React.useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [isCompleteeing, setIsCompleteeing] = useState(false);
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [workflowStep, setWorkflowStep] = useState(null); // 工作流步骤状态
  const [autoWorkflow, setAutoWorkflow] = useState(true); // 自动工作流开关
  const [host, setHost] = React.useState('https://bedu.pingfury.top');
  const [name, setName] = useState('');
  const [activeTab, setActiveTab] = useState('solving');
  const [isImageQuestion, setIsImageQuestion] = useState(false);
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [selectedValue, setSelectedValue] = useState('问答');
  const [subject, setSubject] = useState("shuxue");
  const [gradeLevel, setGradeLevel] = useState('小学');
  const [isSwapActive, setIsSwapActive] = useState(false);
  const [features, setFeatures] = useState({
    jieti: true,
    ocr: true,
    "clue-claiming": false,
    "topic_split": true,
    "documentation": true,
    "docuscan": true,
    "mobile-web": true,
    "audit": true,
    "workflow": true,
    "question_search": true
  });
  const [serverType, setServerType] = useState(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [cozeService, setCozeService] = React.useState(null);
  const [kouziConfig, setKouziConfig] = React.useState(null);
  const [site, setSite] = useState("");
  // 添加长连接引用
  const portRef = useRef(null);

  // 添加LaTeX格式化请求的节流控制
  const latexRequestRef = useRef({
    lastRequestTime: 0,
    pendingRequests: new Map(),
    isProcessing: false,
    throttleTime: 3000, // 3秒节流时间
    requestQueue: [], // 请求队列
    requestHash: new Set() // 用于快速检查重复请求
  });

  // 设置与background.js的长连接
  useEffect(() => {
    // 始终创建长连接，不再根据serverType判断
    console.log('建立流式响应长连接');

    // 创建与background.js的长连接
    const port = chrome.runtime.connect({ name: 'solving-stream-channel' });
    portRef.current = port;
    console.log('长连接已建立');

    // 处理从background.js接收的消息
    port.onMessage.addListener((message) => {
      if (message.action === "stream_format_result" && message.data) {
        // 题干整理不处理思维链内容，直接追加数据
        if (message.dataType !== "reasoning") {
          // 保留数据中的换行符
          setQuestion(prev => prev + message.data);
        }
      } else if (message.action === "stream_complete_result" && message.data) {
        // 残题补全不处理思维链内容，直接追加数据
        if (message.dataType !== "reasoning") {
          // 保留数据中的换行符
          setQuestion(prev => prev + message.data);
        }
      } else if (message.action === "stream_answer_result" && message.data) {
        if (message.dataType === "reasoning") {
          // 思维链数据 - 保留换行符
          setAnswerThinkingChain(prev => prev + message.data);
        } else {
          // 常规内容数据 - 保留换行符
          setAnswer(prev => prev + message.data);
        }
      } else if (message.action === "stream_analysis_result" && message.data) {
        if (message.dataType === "reasoning") {
          // 思维链数据 - 保留换行符
          setAnalysisThinkingChain(prev => prev + message.data);
        } else {
          // 常规内容数据 - 保留换行符
          setAnalysis(prev => prev + message.data);
        }
      } else if (message.action === "stream_error") {
        console.error('流式响应错误:', message.error);
      } else if (message.action === "stream_complete") {
        // 处理流式响应完成
        if (message.type === 'FORMAT_QUESTION') {
          setIsFormatting(false);
        } else if (message.type === 'TOPIC_COMPLETE') {
          setIsCompleteeing(false);
        } else if (message.type === 'TOPIC_ANSWER') {
          setIsGeneratingAnswer(false);
        } else if (message.type === 'TOPIC_ANALYSIS') {
          setIsGeneratingAnalysis(false);
        }
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
  }, []); // 移除serverType依赖，确保只在组件挂载时创建连接

  // Load feature settings from Chrome storage on component mount
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(features, (items) => {
        setFeatures(items);
      });
    } else {
      // Fallback for development environment
      console.log("Chrome storage not available, using default feature settings");
      const storedSettings = localStorage.getItem("eduExpSettings");
      if (storedSettings) {
        try {
          const parsedSettings = JSON.parse(storedSettings);
          setFeatures(parsedSettings);
        } catch (e) {
          console.error("Failed to parse stored settings:", e);
        }
      }
    }
  }, []);

  // Load server type from storage
  useEffect(() => {
    const loadServerType = async () => {
      try {
        setIsSettingsLoading(true);
        const result = await new Promise((resolve) => {
          chrome.storage.sync.get(['serverType'], resolve);
        });

        console.log('Loading serverType from storage:', result);

        if (result.serverType) {
          console.log('Setting serverType to:', result.serverType);
          setServerType(result.serverType);
        } else {
          setServerType("官方服务器");
        }
      } catch (error) {
        console.error('Error loading serverType:', error);
        setServerType("官方服务器");
      } finally {
        setIsSettingsLoading(false);
      }
    };

    loadServerType();
  }, []);

  // Load autoWorkflow from storage
  useEffect(() => {
    chrome.storage.sync.get(['autoWorkflow'], (result) => {
      setAutoWorkflow(result.autoWorkflow ?? true);
    });

    // 监听存储变更
    const handleStorageChange = (changes, namespace) => {
      if (namespace === 'sync' && 'autoWorkflow' in changes) {
        setAutoWorkflow(changes.autoWorkflow.newValue ?? true);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Save serverType to storage when it changes
  useEffect(() => {
    if (serverType) {
      chrome.storage.sync.set({ serverType });
    }
  }, [serverType]);

  // Load site from storage
  useEffect(() => {
    chrome.storage.sync.get(['site'], (result) => {
      if (result.site) {
        setSite(result.site);
      } else {
        // 如果没有存储值，将默认值保存到存储中
        chrome.storage.sync.set({ site: 'bd' });
      }
    });
  }, []);

  // Save site to storage when it changes
  useEffect(() => {
    if (site) {
      chrome.storage.sync.set({ site });
    }
  }, [site]);

  React.useEffect(() => {
    // 监听来自 background 的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SET_QUESTION') {
        // 检查是否包含图片URL格式 [图片：url] 或 [图片: url]（同时支持中英文冒号）
        const imageUrlRegex = /\[图片[：:]\s*(https?:\/\/[^\s\]]+)\]/;
        const questionText = message.data.trim();
        const match = questionText.match(imageUrlRegex);

        if (match && match[1]) {
          // 如果包含图片链接，设置图片题模式并提取图片URL
          setQuestion(questionText.replace(match[0], '').trim());
          setIsImageQuestion(true);
          loadImageAsDataUrl(match[1]);
        } else {
          // 否则正常设置题干，并重置图片相关设置
          setQuestion(questionText);
          setIsImageQuestion(false);
          setSelectedImage(null);
        }
      } else if (message.type === 'FORMAT_LATEX_REQUEST') {
        // 获取当前时间和请求文本的哈希
        const now = Date.now();
        const requestText = message.text || '';
        const requestHash = `latex-${requestText.substring(0, 50)}`; // 使用文本前50个字符作为请求哈希
        const throttleData = latexRequestRef.current;

        // 检查是否存在完全相同的请求正在处理中
        if (throttleData.requestHash.has(requestHash)) {
          return true;
        }

        // 检查是否在节流时间内
        if (now - throttleData.lastRequestTime < throttleData.throttleTime && throttleData.isProcessing) {
          return true;
        }

        // 更新最后请求时间和处理状态
        throttleData.lastRequestTime = now;
        throttleData.isProcessing = true;

        // 添加请求到哈希集合
        throttleData.requestHash.add(requestHash);

        // 添加超时检查，如果3秒内未收到响应，重置处理状态
        const timeoutId = setTimeout(() => {
          throttleData.isProcessing = false;
          throttleData.requestHash.delete(requestHash); // 超时后移除请求哈希
        }, throttleData.throttleTime);

        // 处理LaTeX格式化请求
        (async () => {
          try {
            // 直接从Chrome存储获取最新配置，不依赖组件状态
            const config = await new Promise(resolve => {
              chrome.storage.sync.get(['host', 'name'], resolve);
            });

            if (!config.host || !config.name) {
              throw new Error('未找到服务器配置');
            }

            console.log('使用配置处理LaTeX:', config);

            // 调用format_latex函数处理文本
            const formatted = await format_latex(config.host, config.name, message.text);

            // 清除超时
            clearTimeout(timeoutId);
            // 重置处理状态
            throttleData.isProcessing = false;
            throttleData.requestHash.delete(requestHash); // 完成后移除请求哈希

            if (formatted) {
              sendResponse({ success: true, formatted });
            } else {
              throw new Error('格式化失败');
            }
          } catch (error) {
            // 清除超时
            clearTimeout(timeoutId);
            // 重置处理状态
            throttleData.isProcessing = false;
            throttleData.requestHash.delete(requestHash); // 出错时也移除请求哈希

            console.error('Error formatting LaTeX in sidebar:', error);
            sendResponse({ success: false, error: error.message || '未知错误' });
          }
        })();
        return true; // 保持消息通道开放以等待异步响应
      }
    });
  }, []);

  React.useEffect(() => {
    // 从 Chrome 存储中加载 host
    chrome.storage.sync.get(['host'], (result) => {
      if (result.host) {
        setHost(result.host);
      } else {
        // 如果没有存储值，将默认值保存到存储中
        chrome.storage.sync.set({ host: 'https://bedu.pingfury.top' });
      }
    });
  }, []);

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };

  // 加载图片并转换为Data URL的函数
  const loadImageAsDataUrl = (url) => {
    setSelectedImage(url);
  };

  const handleFormat = async () => {
    setIsFormatting(true);
    try {
      if (serverType === "扣子") {
        // 检查扣子服务器的必要组件是否已初始化
        if (!cozeService || !kouziConfig) {
          console.error('扣子服务器配置未完成初始化');
          setQuestion('扣子服务器配置未完成，请检查设置页面的扣子配置');
          setIsFormatting(false);
          return;
        }

        // 扣子服务器处理逻辑保持不变
        const workflowResult = await cozeService.executeWorkflow(kouziConfig.workflowId, {
          app_id: kouziConfig.appId,
          parameters: {
            type: 'format',
            topic: question,
            discipline: subject,
            site: site
          }
        });

        if (workflowResult && workflowResult.data) {
          try {
            const parsedData = typeof workflowResult.data === 'string'
              ? JSON.parse(workflowResult.data)
              : workflowResult.data;

            if (parsedData && parsedData.topic) {
              setQuestion(parsedData.topic);
            } else {
              console.error('Invalid workflow result format');
            }
          } catch (error) {
            console.error('Error parsing workflow result:', error);
          }
        }
        setIsFormatting(false);
      } else {
        // 修改为直接使用run_llm_stream函数
        console.log('使用流式响应处理题干整理');
        setQuestion(''); // 清空之前的结果

        // 直接调用run_llm_stream函数
        run_llm_stream(
          host,
          name,
          'topic_format',
          {'topic': question, 'discipline': subject},
          // 数据块处理函数
          (chunk) => {
            try {
              // 过滤掉 [DONE]
              if (chunk.trim() === '[DONE]') {
                return;
              }

              // 尝试解析JSON数据
              const data = JSON.parse(chunk);

              if (data.type === 'reasoning') {
                // 思考过程内容 - 仅记录日志
                console.log('思维链数据:', data.text || '');
              } else if (data.type === 'content') {
                // 主要内容
                setQuestion(prev => prev + (data.text || ''));
              } else {
                // 兼容其他字段名
                const text = data.text || data.topic || data.content || '';
                if (text) {
                  setQuestion(prev => prev + text);
                }
              }
            } catch (e) {
              // 如果不是JSON格式，当作普通文本处理
              if (chunk.trim() !== '[DONE]') {
                console.log('Chunk is not JSON format:', chunk);
              }
            }
          },
          // 错误处理函数
          (error) => {
            console.error("流式请求出错:", error);
            setIsFormatting(false);
          },
          // 完成处理函数
          () => {
            setIsFormatting(false);
            // 流式响应完成后，根据site条件执行 removeEmptyLinesFromString
            setQuestion(prev => site === 'bc' ? prev : removeEmptyLinesFromString(prev, gradeLevel === "小学"));
          }
        );
      }
    } catch (error) {
      console.error('Error formatting question:', error);
      setIsFormatting(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleteeing(true);
    try {
      if (serverType === "扣子") {
        // 检查扣子服务器的必要组件是否已初始化
        if (!cozeService || !kouziConfig) {
          console.error('扣子服务器配置未完成初始化');
          setQuestion('扣子服务器配置未完成，请检查设置页面的扣子配置');
          setIsCompleteeing(false);
          return;
        }

        // 扣子服务器处理逻辑保持不变
        const workflowResult = await cozeService.executeWorkflow(kouziConfig.workflowId, {
          app_id: kouziConfig.appId,
          parameters: {
            type: 'complete',
            topic: question,
            discipline: subject,
            site: site
          }
        });

        if (workflowResult && workflowResult.data) {
          try {
            const parsedData = typeof workflowResult.data === 'string'
              ? JSON.parse(workflowResult.data)
              : workflowResult.data;

            if (parsedData && parsedData.topic) {
              setQuestion(parsedData.topic);
            } else {
              console.error('Invalid workflow result format');
            }
          } catch (error) {
            console.error('Error parsing workflow result:', error);
          }
        }
        setIsCompleteeing(false);
      } else {
        // 修改为直接使用run_llm_stream函数
        console.log('使用流式响应处理残题补全');
        setQuestion(''); // 清空之前的结果

        // 直接调用run_llm_stream函数
        run_llm_stream(
          host,
          name,
          'topic_complete',
          {'topic': question, 'discipline': subject},
          // 数据块处理函数
          (chunk) => {
            try {
              // 过滤掉 [DONE]
              if (chunk.trim() === '[DONE]') {
                return;
              }

              // 尝试解析JSON数据
              const data = JSON.parse(chunk);

              if (data.type === 'reasoning') {
                // 思考过程内容 - 仅记录日志
                console.log('思维链数据:', data.text || '');
              } else if (data.type === 'content') {
                // 主要内容
                setQuestion(prev => prev + (data.text || ''));
              } else {
                // 兼容其他字段名
                const text = data.text || data.topic || data.content || '';
                if (text) {
                  setQuestion(prev => prev + text);
                }
              }
            } catch (e) {
              // 如果不是JSON格式，当作普通文本处理
              if (chunk.trim() !== '[DONE]') {
                console.log('Chunk is not JSON format:', chunk);
              }
            }
          },
          // 错误处理函数
          (error) => {
            console.error("流式请求出错:", error);
            setIsCompleteeing(false);
          },
          // 完成处理函数
          () => {
            setIsCompleteeing(false);
            // 流式响应完成后，根据site条件执行 removeEmptyLinesFromString
            setQuestion(prev => site === 'bc' ? prev : removeEmptyLinesFromString(prev, gradeLevel === "小学"));
          }
        );
      }
    } catch (error) {
      console.error('Error completing topic:', error);
      setIsCompleteeing(false);
    }
  };

  const handleHostChange = (e) => {
    const newHost = e.target.value.trim();
    setHost(newHost);
    // 更新 Chrome 存储
    chrome.storage.sync.set({ host: newHost }, () => {
    });
  };

  const handleGenerateAnswer = async () => {
    setIsGeneratingAnswer(true);
    // 重置工作流状态，开始新的工作流
    setWorkflowStep('generating_answer');
    // 添加诊断日志
    console.log('生成解答时的服务器类型:', serverType);
    console.log('CozeService状态:', cozeService);
    console.log('KouziConfig状态:', kouziConfig);

    try {
      if (serverType === "扣子") {
        // 检查扣子服务器的必要组件是否已初始化
        if (!cozeService || !kouziConfig) {
          console.error('扣子服务器配置未完成初始化，切换到官方服务器逻辑');
          // 如果扣子服务器配置未完成，显示错误信息
          setAnswer('扣子服务器配置未完成，请检查设置页面的扣子配置');
          setIsGeneratingAnswer(false);
          return;
        }

        // 扣子服务器处理逻辑保持不变
        let imageFileId = null;
        if (selectedImage) {
          // Convert base64 to blob
          const base64Data = selectedImage.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
            const slice = byteCharacters.slice(offset, offset + 1024);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          const blob = new Blob(byteArrays, { type: 'image/jpeg' });
          const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

          // Upload file
          const uploadResult = await cozeService.uploadFile(file);
          imageFileId = uploadResult.id;
        }

        const workflowResult = await cozeService.executeWorkflow(kouziConfig.workflowId, {
          app_id: kouziConfig.appId,
          parameters: {
            type: 'answer',
            topic: question,
            discipline: subject,
            topic_type: selectedValue,
            school_level: gradeLevel,
            site: site,
            ...(imageFileId && {
              image: {
                type: "image",
                file_id: imageFileId
              }
            })
          }
        });

        if (workflowResult && workflowResult.data) {
          try {
            const parsedData = typeof workflowResult.data === 'string'
              ? JSON.parse(workflowResult.data)
              : workflowResult.data;

            if (parsedData && parsedData.topic) {
              const finalAnswer = parsedData.topic.trim();
              setAnswer(finalAnswer);
              // 检查是否启用自动工作流
              if (autoWorkflow) {
                // 在完成生成解答后，自动填入解答并继续生成解析
                setTimeout(() => {
                  if (finalAnswer.trim()) {
                    // 自动填入解答
                    chrome.runtime.sendMessage({
                      type: "answer",
                      text: finalAnswer
                    });
                    // 设置工作流步骤为已填入解答
                    setWorkflowStep('answer_filled');
                    // 延迟后自动开始生成解析
                    setTimeout(() => {
                      handleGenerateAnalysis();
                    }, 500);
                  }
                }, 100);
              }
            } else {
              console.error('Invalid workflow result format');
            }
          } catch (error) {
            console.error('Error parsing workflow result:', error);
          }
        }
        setIsGeneratingAnswer(false);
      } else {
        // 修改为直接使用run_llm_stream函数
        console.log('使用流式响应生成解答');
        setAnswer(''); // 清空之前的结果
        setAnswerThinkingChain(''); // 清空思维链数据

        // 直接调用run_llm_stream函数
        run_llm_stream(
          host,
          name,
          'topic_answer',
          {
            'topic': question,
            'discipline': subject,
            'image_data': selectedImage,
            'topic_type': selectedValue,
            'school_level': gradeLevel,
            'site': site,
            'analysis': analysis
          },
          // 数据块处理函数
          (chunk) => {
            try {
              // 过滤掉 [DONE]
              if (chunk.trim() === '[DONE]') {
                return;
              }

              // 尝试解析JSON数据
              const data = JSON.parse(chunk);

              if (data.type === 'reasoning') {
                // 思考过程内容
                setAnswerThinkingChain(prev => prev + (data.text || ''));
              } else if (data.type === 'content') {
                // 主要内容
                setAnswer(prev => prev + (data.text || ''));
              } else {
                // 兼容其他字段名
                const text = data.text || data.topic || data.content || '';
                if (text) {
                  setAnswer(prev => prev + text);
                }
              }
            } catch (e) {
              // 如果不是JSON格式，当作普通文本处理
              if (chunk.trim() !== '[DONE]') {
                console.log('Chunk is not JSON format:', chunk);
              }
            }
          },
          // 错误处理函数
          (error) => {
            console.error("流式请求出错:", error);
            setIsGeneratingAnswer(false);
          },
          // 完成处理函数
          () => {
            setIsGeneratingAnswer(false);
            // 流式响应完成后，根据site条件执行 removeEmptyLinesFromString
            setAnswer(prev => {
              const finalAnswer = site === 'bc' ? prev : removeEmptyLinesFromString(prev, gradeLevel === "小学");
              // 检查是否启用自动工作流
              if (autoWorkflow) {
                // 在完成生成解答后，自动填入解答并继续生成解析
                setTimeout(() => {
                  if (finalAnswer.trim()) {
                    // 自动填入解答
                    chrome.runtime.sendMessage({
                      type: "answer",
                      text: finalAnswer
                    });
                    // 设置工作流步骤为已填入解答
                    setWorkflowStep('answer_filled');
                    // 延迟后自动开始生成解析
                    setTimeout(() => {
                      handleGenerateAnalysis();
                    }, 500);
                  }
                }, 100);
              }
              return finalAnswer;
            });
          }
        );
      }
    } catch (error) {
      console.error('Error generating answer:', error);
      setIsGeneratingAnswer(false);
    }
  };

  const handleGenerateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    try {
      if (serverType === "扣子") {
        // 检查扣子服务器的必要组件是否已初始化
        if (!cozeService) {
          console.error('扣子服务器配置未完成初始化');
          setAnalysis('扣子服务器配置未完成，请检查设置页面的扣子配置');
          setIsGeneratingAnalysis(false);
          return;
        }

        // 扣子服务器处理逻辑保持不变
        let imageFileId = null;
        if (selectedImage) {
          // Convert base64 to blob
          const base64Data = selectedImage.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
            const slice = byteCharacters.slice(offset, offset + 1024);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          const blob = new Blob(byteArrays, { type: 'image/jpeg' });
          const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

          // Upload file
          const uploadResult = await cozeService.uploadFile(file);
          imageFileId = uploadResult.id;
        }

        const workflowResult = await cozeService.executeWorkflow(kouziConfig.workflowId, {
          app_id: kouziConfig.appId,
          parameters: {
            type: 'analysis',
            topic: question,
            answer: answer,
            analysis: analysis,
            discipline: subject,
            topic_type: selectedValue,
            school_level: gradeLevel,
            site: site,
            ...(imageFileId && {
              image: {
                type: "image",
                file_id: imageFileId
              }
            })
          }
        });

        if (workflowResult && workflowResult.data) {
          try {
            const parsedData = typeof workflowResult.data === 'string'
              ? JSON.parse(workflowResult.data)
              : workflowResult.data;

            if (parsedData && parsedData.topic) {
              const finalAnalysis = parsedData.topic.trim();
              setAnalysis(finalAnalysis);
              // 检查是否启用自动工作流
              if (autoWorkflow) {
                // 在完成生成解析后，自动填入解析
                setTimeout(() => {
                  if (finalAnalysis.trim()) {
                    // 自动填入解析
                    chrome.runtime.sendMessage({
                      type: "analysis",
                      text: finalAnalysis
                    });
                    // 设置工作流步骤为已填入解析，完成整个流程
                    setWorkflowStep('analysis_filled');
                  }
                }, 100);
              }
            } else {
              console.error('Invalid workflow result format');
            }
          } catch (error) {
            console.error('Error parsing workflow result:', error);
          }
        }
        setIsGeneratingAnalysis(false);
      } else {
        // 修改为直接使用run_llm_stream函数
        console.log('使用流式响应生成解析');
        setAnalysis(''); // 清空之前的结果
        setAnalysisThinkingChain(''); // 清空思维链数据

        // 直接调用run_llm_stream函数
        run_llm_stream(
          host,
          name,
          'topic_analysis',
          {
            'topic': question,
            'answer': answer,
            'analysis': analysis,
            'discipline': subject,
            'image_data': selectedImage,
            'topic_type': selectedValue,
            'school_level': gradeLevel,
            'site': site
          },
          // 数据块处理函数
          (chunk) => {
            try {
              // 过滤掉 [DONE]
              if (chunk.trim() === '[DONE]') {
                return;
              }

              // 尝试解析JSON数据
              const data = JSON.parse(chunk);

              if (data.type === 'reasoning') {
                // 思考过程内容
                setAnalysisThinkingChain(prev => prev + (data.text || ''));
              } else if (data.type === 'content') {
                // 主要内容
                setAnalysis(prev => prev + (data.text || ''));
              } else {
                // 兼容其他字段名
                const text = data.text || data.topic || data.content || '';
                if (text) {
                  setAnalysis(prev => prev + text);
                }
              }
            } catch (e) {
              // 如果不是JSON格式，当作普通文本处理
              if (chunk.trim() !== '[DONE]') {
                console.log('Chunk is not JSON format:', chunk);
              }
            }
          },
          // 错误处理函数
          (error) => {
            console.error("流式请求出错:", error);
            setIsGeneratingAnalysis(false);
          },
          // 完成处理函数
          () => {
            setIsGeneratingAnalysis(false);
            // 流式响应完成后，根据site条件执行 removeEmptyLinesFromString
            setAnalysis(prev => {
              const finalAnalysis = site === 'bc' ? prev : removeEmptyLinesFromString(prev, gradeLevel === "小学");
              // 检查是否启用自动工作流
              if (autoWorkflow) {
                // 在完成生成解析后，自动填入解析
                setTimeout(() => {
                  if (finalAnalysis.trim()) {
                    // 自动填入解析
                    chrome.runtime.sendMessage({
                      type: "analysis",
                      text: finalAnalysis
                    });
                    // 设置工作流步骤为已填入解析，完成整个流程
                    setWorkflowStep('analysis_filled');
                  }
                }, 100);
              }
              return finalAnalysis;
            });
          }
        );
      }
    } catch (error) {
      console.error('Error generating analysis:', error);
      setIsGeneratingAnalysis(false);
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value.trim());
    chrome.storage.sync.set({ name: e.target.value });
  };

  useEffect(() => {
    chrome.storage.sync.get(['name'], (result) => {
      if (result.name) {
        setName(result.name);
      }
    });
  }, []);


  useEffect(() => {
    // 从 Chrome 存储中加载上次选择的 tab
    chrome.storage.sync.get(['activeTab'], (result) => {
      if (result.activeTab) {
        setActiveTab(result.activeTab);
      }
    });
  }, []);

  // Switch to available tab if current active tab is disabled
  useEffect(() => {
    console.log("Checking active tab against feature flags:", { activeTab, features });

    if (
      (activeTab === 'solving' && !features.jieti) ||
        (activeTab === 'ocr' && !features.ocr) ||
        (activeTab === 'workflow' && !features.workflow) ||
        (activeTab === 'clue-claiming' && !features["clue-claiming"]) ||
        (activeTab === 'audit' && !features.audit) ||
        (activeTab === 'question_search' && !features.question_search)
    ) {
      // Find the first enabled tab or default to settings
      if (features.jieti) {
        setActiveTab('solving');
      } else if (features.ocr) {
        setActiveTab('ocr');
      } else if (features.workflow) {
        setActiveTab('workflow');
      } else if (features["clue-claiming"]) {
        setActiveTab('clue-claiming');
      } else {
        setActiveTab('settings');
      }
    }
  }, [features.jieti, features.ocr, features.workflow, features["clue-claiming"], features.audit, features.question_search, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // 更新 Chrome 存储
    chrome.storage.sync.set({ activeTab: tab });
  };

  useEffect(() => {
    // 从 Chrome 存储中加载 isSwapActive
    chrome.storage.sync.get(['isSwapActive'], (result) => {
      if (result.isSwapActive !== undefined) {
        setIsSwapActive(result.isSwapActive);
      }
    });
  }, []);


  // Listen for changes in chrome.storage to update features in real-time
  useEffect(() => {
    const handleStorageChange = (changes, namespace) => {
      if (namespace === 'sync') {
        let hasChanges = false;
        let changedFeatureName = '';
        let status = false;

        // Create a copy of current features state
        const updatedFeatures = {...features};

        // Check each feature flag
        if ('jieti' in changes) {
          updatedFeatures.jieti = changes.jieti.newValue;
          hasChanges = true;
          changedFeatureName = '解题功能';
          status = changes.jieti.newValue;
        }

        if ('ocr' in changes) {
          updatedFeatures.ocr = changes.ocr.newValue;
          hasChanges = true;
          changedFeatureName = '文字识别';
          status = changes.ocr.newValue;
        }

        if ('clue-claiming' in changes) {
          updatedFeatures["clue-claiming"] = changes["clue-claiming"].newValue;
          hasChanges = true;
          changedFeatureName = '线索认领';
          status = changes["clue-claiming"].newValue;
        }

        if ('audit' in changes) {
          updatedFeatures.audit = changes.audit.newValue;
          hasChanges = true;
          changedFeatureName = '审核功能';
          status = changes.audit.newValue;
        }

        if ('workflow' in changes) {
          updatedFeatures.workflow = changes.workflow.newValue;
          hasChanges = true;
          changedFeatureName = '工作流';
          status = changes.workflow.newValue;
        }

        if ('question_search' in changes) {
          updatedFeatures.question_search = changes.question_search.newValue;
          hasChanges = true;
          changedFeatureName = '题干搜索';
          status = changes.question_search.newValue;
        }

        // Update state and show toast if any changes
        if (hasChanges) {
          setFeatures(updatedFeatures);
          console.log(`${changedFeatureName}已${status ? '启用' : '禁用'}`);
        }
      }
    };

    // Add listener
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    // Cleanup
    return () => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, [features]);

  // Initialize CozeService when serverType is "扣子"
  React.useEffect(() => {
    if (serverType === "扣子") {
      chrome.storage.sync.get(['kouziAccessKey', 'kouziSolveWorkflowId', 'kouziAppId'], (result) => {
        if (result.kouziAccessKey && result.kouziSolveWorkflowId && result.kouziAppId) {
          setCozeService(new CozeService(result.kouziAccessKey));
          setKouziConfig({
            workflowId: result.kouziSolveWorkflowId,
            appId: result.kouziAppId
          });
        } else {
          console.error('Missing required Kouzi configuration');
          // Optionally show an error message to the user
        }
      });
    } else {
      // 当切换到非扣子服务器时，清理相关状态
      setCozeService(null);
      setKouziConfig(null);
    }
  }, [serverType]);

  return (<div className="w-full px-1 mt-2">
            <div className="pb-1">
              <div className="tabs tabs-boxed w-full flex justify-between">
              <a className={`tab px-2 py-1 text-sm ${activeTab === 'settings' ? 'tab-active' : ''}`} onClick={() => handleTabChange('settings')}>设置</a>
              {features.jieti && (
                <a className={`tab px-2 py-1 text-sm ${activeTab === 'solving' ? 'tab-active' : ''}`} onClick={() => handleTabChange('solving')}>解题</a>
              )}
              {features.ocr && (
                <a className={`tab px-2 py-1 text-sm ${activeTab === 'ocr' ? 'tab-active' : ''}`} onClick={() => handleTabChange('ocr')}>文字识别</a>
              )}
              {features.workflow && (
                <a className={`tab px-2 py-1 text-sm ${activeTab === 'workflow' ? 'tab-active' : ''}`} onClick={() => handleTabChange('workflow')}>工作流</a>
              )}

              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="tab">更多 ▼</label>
                <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-[9999]">
                  {features.topic_split && (
                    <li><a className={activeTab === 'topic_split' ? 'active' : ''} onClick={() => handleTabChange('topic_split')}>题目切割</a></li>
                  )}
                  {features.audit && (
                    <li><a className={activeTab === 'audit' ? 'active' : ''} onClick={() => handleTabChange('audit')}>审核</a></li>
                  )}
                  {features.question_search && (
                    <li><a className={activeTab === 'question_search' ? 'active' : ''} onClick={() => handleTabChange('question_search')}>题干搜索</a></li>
                  )}
                  {/* {features["clue-claiming"] && (
                    <li><a className={activeTab === 'clue-claiming' ? 'active' : ''} onClick={() => handleTabChange('clue-claiming')}>线索认领</a></li>
                  )} */}
                  {features.documentation && (
                    <li><a className={activeTab === 'documentation' ? 'active' : ''} onClick={() => handleTabChange('documentation')}>文档</a></li>
                  )}
                  {features.docuscan && (
                    <li><a className={activeTab === 'docuscan' ? 'active' : ''} onClick={() => handleTabChange('docuscan')}>图片白底化</a></li>
                  )}
                  {features["mobile-web"] && (
                    <li><a className={activeTab === 'mobile-web' ? 'active' : ''} onClick={() => handleTabChange('mobile-web')}>移动网页版</a></li>
                  )}
                  <li><a className={activeTab === 'feedback' ? 'active' : ''} onClick={() => handleTabChange('feedback')}>问题反馈</a></li>
                </ul>
              </div>
              </div>
            </div>
            {activeTab === 'settings' && (
              <div className="w-full mt-2">
                <ApiSettingsForm
                  host={host}
                  handleHostChange={handleHostChange}
                  name={name}
                  handleNameChange={handleNameChange}
                  serverType={serverType}
                  setServerType={setServerType}
                  isSettingsLoading={isSettingsLoading}
                />
              </div>
            )}
            {activeTab === 'solving' && (
              <QuestionAnswerForm
                question={question}
                setQuestion={setQuestion}
                handleQuestionChange={handleQuestionChange}
                answer={answer}
                setAnswer={setAnswer}
                analysis={analysis}
                setAnalysis={setAnalysis}
                answerThinkingChain={answerThinkingChain}
                analysisThinkingChain={analysisThinkingChain}
                isFormatting={isFormatting}
                handleFormat={handleFormat}
                isCompleteeing={isCompleteeing}
                handleComplete={handleComplete}
                isGeneratingAnswer={isGeneratingAnswer}
                handleGenerateAnswer={handleGenerateAnswer}
                isGeneratingAnalysis={isGeneratingAnalysis}
                handleGenerateAnalysis={handleGenerateAnalysis}
                isImageQuestion={isImageQuestion}
                setIsImageQuestion={setIsImageQuestion}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                selectedValue={selectedValue}
                setSelectedValue={setSelectedValue}
                host={host}
                uname={name}
                subject={subject}
                setSubject={setSubject}
                serverType={serverType}
                gradeLevel={gradeLevel}
                setGradeLevel={setGradeLevel}
                site={site}
                setSite={setSite}
                setAnswerThinkingChain={setAnswerThinkingChain}
                setAnalysisThinkingChain={setAnalysisThinkingChain}
                workflowStep={workflowStep}
              />
            )}
            {activeTab === 'ocr' && (
              <OcrComponent
                host={host}
                uname={name}
                serverType={serverType}
              />
            )}
            {activeTab === 'workflow' && (
              <WorkflowComponent
                host={host}
                uname={name}
                serverType={serverType}
              />
            )}
            {activeTab === 'clue-claiming' && (
              <ClueClaimingComponent />
            )}
            {activeTab === 'topic_split' && (
              <TopicSplitComponent
                host={host}
                uname={name}
                serverType={serverType}
              />
            )}
            {activeTab === 'documentation' && (
              <DocumentationComponent />
            )}
            {activeTab === 'docuscan' && (
              <DocuScanComponent />
            )}
            {activeTab === 'mobile-web' && (
              <MobileWebComponent />
            )}
            {activeTab === 'audit' && (
              <AuditComponent
                host={host}
                uname={name}
                serverType={serverType}
              />
            )}
            {activeTab === 'question_search' && (
              <QuestionSearchComponent
                host={host}
                uname={name}
                serverType={serverType}
              />
            )}
            {activeTab === 'feedback' && (
              <FeedbackComponent />
            )}
          </div>)
}
