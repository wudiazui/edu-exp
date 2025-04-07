import React, { useState, useEffect } from 'react';
import { loadKeywords, saveKeywords } from '../content/keywordStorageModule.js';

export default function ClueClaimingComponent() {
  const [loading, setLoading] = useState(false);
  const [filterData, setFilterData] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedTaskType, setSelectedTaskType] = useState(() => {
    const savedTaskType = localStorage.getItem('selectedTaskType');
    return savedTaskType || 'audittask';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [autoClaimingActive, setAutoClaimingActive] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(1); // Default to 1 second initially
  const [claimResponse, setClaimResponse] = useState(null); // Add new state for claim response
  const [includeKeywords, setIncludeKeywords] = useState([]);
  const [excludeKeywords, setExcludeKeywords] = useState([]);
  const [newIncludeKeyword, setNewIncludeKeyword] = useState('');
  const [newExcludeKeyword, setNewExcludeKeyword] = useState('');

  // 从存储中加载关键词
  useEffect(() => {
    // 加载保存的关键词
    loadKeywords().then(({ includeKeywords, excludeKeywords }) => {
      setIncludeKeywords(includeKeywords || []);
      setExcludeKeywords(excludeKeywords || []);
    }).catch(error => {
      console.error('加载关键词出错:', error);
    });
  }, []);

  // 当关键词更新时保存到存储
  useEffect(() => {
    // 关键词有变化时自动保存
    const saveTimer = setTimeout(() => {
      saveKeywords(includeKeywords, excludeKeywords);
    }, 300); // 防抖动，避免频繁保存
    
    return () => clearTimeout(saveTimer);
  }, [includeKeywords, excludeKeywords]);

  // 加载审核任务数据
  useEffect(() => {
    setIsLoading(true);
    // 创建一个标志来跟踪组件是否已卸载
    let isComponentMounted = true;

    // 发送消息到背景脚本
    const port = chrome.runtime.connect({ name: 'audit-task-label' });
    
    port.postMessage({ type: 'GET_AUDIT_TASK_LABEL', selectedTaskType });
    
    port.onMessage.addListener((response) => {
      if (isComponentMounted && response.errno === 0 && response.data?.filter) {
        setFilterData(response.data.filter);
        
        const stepData = response.data.filter.find(f => f.id === 'step')?.list || [];
        const subjectData = response.data.filter.find(f => f.id === 'subject')?.list || [];
        const clueTypeData = response.data.filter.find(f => f.id === 'clueType')?.list || [];

        setSelectedGrade(stepData[0]?.name || '');
        setSelectedSubject(subjectData[0]?.name || '');
        setSelectedType(clueTypeData[0]?.name || '');
        
        setIsLoading(false);
      }
    });

    port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        console.error('连接错误:', chrome.runtime.lastError);
        if (isComponentMounted) {
          setIsLoading(false);
        }
      }
    });

    // 清理函数
    return () => {
      isComponentMounted = false;
      port.disconnect();
    };
  }, [selectedTaskType]); // 添加 selectedTaskType 作为依赖项

  // 在组件加载时从storage加载保存的间隔值和自动认领状态
  useEffect(() => {
    chrome.storage.local.get(['autoClaimingInterval', 'autoClaimingActive'], (result) => {
      if (result.autoClaimingInterval) {
        setRefreshInterval(parseFloat(result.autoClaimingInterval));
      }
      if (result.autoClaimingActive !== undefined) {
        setAutoClaimingActive(result.autoClaimingActive);
      }
    });
  }, []);

  // 监听storage变化，保持与background.js同步
  useEffect(() => {
    const handleStorageChange = (changes) => {
      // 处理本地存储变化（自动认领设置）
      if (changes.autoClaimingInterval) {
        setRefreshInterval(parseFloat(changes.autoClaimingInterval.newValue));
      }
      if (changes.autoClaimingActive) {
        setAutoClaimingActive(changes.autoClaimingActive.newValue);
      }
      
      // 处理同步存储变化（关键词）
      // 使用 keywordStorageModule 中定义的键名
      if (changes['clue_include_keywords']) {
        setIncludeKeywords(changes['clue_include_keywords'].newValue || []);
      }
      if (changes['clue_exclude_keywords']) {
        setExcludeKeywords(changes['clue_exclude_keywords'].newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // 当选择值变化时保存到storage
  useEffect(() => {
    chrome.storage.local.set({
      selectedGrade,
      selectedSubject,
      selectedType,
      includeKeywords,
      excludeKeywords
    });
  }, [selectedGrade, selectedSubject, selectedType, includeKeywords, excludeKeywords]);

  // Load selectedTaskType from localStorage on mount
  useEffect(() => {
    const savedTaskType = localStorage.getItem('selectedTaskType');
    if (savedTaskType) {
      setSelectedTaskType(savedTaskType);
    }
  }, []);

  // Update selectedTaskType state and localStorage when changed
  const handleTaskTypeChange = (value) => {
    setSelectedTaskType(value);
    localStorage.setItem('selectedTaskType', value);
  };

  // Add message listener for claim response
  useEffect(() => {
    const messageListener = (request, sender, sendResponse) => {
      if (request.type === 'CLAIM_AUDIT_TASK_RESPONSE') {
        setClaimResponse(request.data);
        // Reset the response after 3 seconds
        setTimeout(() => {
          setClaimResponse(null);
        }, 3000);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const startAutoClaiming = async (interval = refreshInterval) => {
    const stepData = selectedGrade;
    const subjectData = selectedSubject;
    const clueTypeData = selectedType;
    chrome.runtime.sendMessage({
      action: "start_auto_claiming",
      interval: interval * 1000,  // 转换为毫秒
      params: {
        pn: 1,
        rn: 20,
        clueID: '', 
        clueType: filterData.find(f => f.id === 'clueType')?.list.find(item => item.name === clueTypeData)?.id || 1,
        step: filterData.find(f => f.id === 'step')?.list.find(item => item.name === stepData)?.id || 1,
        subject: filterData.find(f => f.id === 'subject')?.list.find(item => item.name === subjectData)?.id || 2,
        taskType: selectedTaskType
      }
    }, (response) => {
      if (response && response.status === "started") {
        setAutoClaimingActive(true);
        console.log("自动认领已开始");
      }
    });
  };

  const stopAutoClaiming = () => {
    chrome.runtime.sendMessage({
      action: "stop_auto_claiming"
    }, (response) => {
      if (response && response.status === "stopped") {
        setAutoClaimingActive(false);
        console.log("自动认领已停止");
      }
    });
  };

  return (
    <div className="w-full mt-2">
      {isLoading && <div className="my-1">Loading...</div>}
      <div className="flex flex-col gap-4 mb-4">
        <div className="form-control">
            <select 
              className="select select-bordered select-sm w-full"
              value={selectedTaskType}
              onChange={(e) => handleTaskTypeChange(e.target.value)}
            >
              <option value="audittask">审核</option>
              <option value="producetask">生产</option>
            </select>
        </div>
        <div className="flex gap-2">
          <div className="form-control w-1/3">
            <select 
              className="select select-bordered select-sm w-full" 
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              {filterData?.find(f => f.id === 'step')?.list.map(item => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="form-control w-1/3">
            <select 
              className="select select-bordered select-sm w-full"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {filterData?.find(f => f.id === 'subject')?.list.map(item => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="form-control w-1/3">
            <select 
              className="select select-bordered select-sm w-full"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {filterData?.find(f => f.id === 'clueType')?.list.map(item => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 关键词过滤UI */}
        <div className="flex flex-col gap-3 mt-2 border border-gray-200 rounded-md p-3 bg-gray-50">
          {/* 包含关键词 */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">包含关键词:</span>
              <div className="flex items-center">
                <input
                  type="text"
                  className="input input-bordered input-sm w-36 mr-1"
                  placeholder="请输入关键词"
                  value={newIncludeKeyword}
                  onChange={(e) => setNewIncludeKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newIncludeKeyword.trim()) {
                      setIncludeKeywords([...includeKeywords, newIncludeKeyword.trim()]);
                      setNewIncludeKeyword('');
                    }
                  }}
                />
                <button 
                  className="btn btn-sm btn-primary btn-outline"
                  onClick={() => {
                    if (newIncludeKeyword.trim()) {
                      setIncludeKeywords([...includeKeywords, newIncludeKeyword.trim()]);
                      setNewIncludeKeyword('');
                    }
                  }}
                >
                  添加
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 min-h-[28px]">
              {includeKeywords.map((keyword, index) => (
                <div key={index} className="flex items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                  <span className="text-sm text-blue-700">{keyword}</span>
                  <button 
                    className="ml-1.5 text-blue-400 hover:text-red-500 font-bold"
                    onClick={() => {
                      const newKeywords = [...includeKeywords];
                      newKeywords.splice(index, 1);
                      setIncludeKeywords(newKeywords);
                    }}
                  >
                    <span className="text-sm">×</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 排除关键词 */}
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">排除关键词:</span>
              <div className="flex items-center">
                <input
                  type="text"
                  className="input input-bordered input-sm w-36 mr-1"
                  placeholder="请输入关键词"
                  value={newExcludeKeyword}
                  onChange={(e) => setNewExcludeKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newExcludeKeyword.trim()) {
                      setExcludeKeywords([...excludeKeywords, newExcludeKeyword.trim()]);
                      setNewExcludeKeyword('');
                    }
                  }}
                />
                <button 
                  className="btn btn-sm btn-primary btn-outline"
                  onClick={() => {
                    if (newExcludeKeyword.trim()) {
                      setExcludeKeywords([...excludeKeywords, newExcludeKeyword.trim()]);
                      setNewExcludeKeyword('');
                    }
                  }}
                >
                  添加
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 min-h-[28px]">
              {excludeKeywords.map((keyword, index) => (
                <div key={index} className="flex items-center bg-red-50 border border-red-200 rounded-full px-3 py-1">
                  <span className="text-sm text-red-700">{keyword}</span>
                  <button 
                    className="ml-1.5 text-red-400 hover:text-red-600 font-bold"
                    onClick={() => {
                      const newKeywords = [...excludeKeywords];
                      newKeywords.splice(index, 1);
                      setExcludeKeywords(newKeywords);
                    }}
                  >
                    <span className="text-sm">×</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <label className="text-sm">刷新间隔(秒):</label>
          <input
            type="number"
            className="input input-bordered input-sm w-32"
            value={refreshInterval}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value >= 0.5) { // 最小0.5秒
                setRefreshInterval(value);
                chrome.storage.local.set({ autoClaimingInterval: value });
                if (autoClaimingActive) {
                  // 如果正在运行，则重新启动以应用新间隔
                  stopAutoClaiming();
                  setTimeout(() => startAutoClaiming(value), 100); // 短暂延迟确保停止完成
                }
              }
            }}
            min="0.5"
            step="0.1"
          />
        </div>

        <div className="flex gap-2">
          <button 
            className={`btn btn-primary flex-1 ${autoClaimingActive ? 'btn-error' : ''}`}
            onClick={autoClaimingActive ? stopAutoClaiming : startAutoClaiming}
            disabled={loading}
          >
            {autoClaimingActive ? '停止线索自动认领' : '开始线索自动认领'}
          </button>
        </div>

        {autoClaimingActive && (
          <div className="text-center text-sm text-primary">
            线索自动认领进行中...
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        {claimResponse && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-sm">
            <p className="text-sm">
                {claimResponse?.total} 个认领成功，{claimResponse?.errList?.length} 个认领失败`
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
