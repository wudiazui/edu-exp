import React, { useState, useEffect } from 'react';

export default function ClueClaimingComponent() {
  const [clues, setClues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterData, setFilterData] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoClaimingActive, setAutoClaimingActive] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(1); // Default to 1 second initially

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
      if (changes.autoClaimingInterval) {
        setRefreshInterval(parseFloat(changes.autoClaimingInterval.newValue));
      }
      if (changes.autoClaimingActive) {
        setAutoClaimingActive(changes.autoClaimingActive.newValue);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    // 创建一个标志来跟踪组件是否已卸载
    let isComponentMounted = true;

    // 发送消息到背景脚本
    const port = chrome.runtime.connect({ name: 'audit-task-label' });
    
    port.postMessage({ type: 'GET_AUDIT_TASK_LABEL' });
    
    port.onMessage.addListener((response) => {
      if (!isComponentMounted) return;
      
      setIsLoading(false);
      if (response.errno === 0 && response.data?.filter) {
        setFilterData(response.data.filter);
        // 设置每个列表的初始值
        const stepData = response.data.filter.find(f => f.id === 'step');
        const subjectData = response.data.filter.find(f => f.id === 'subject');
        const clueTypeData = response.data.filter.find(f => f.id === 'clueType');
        
        setSelectedGrade(stepData?.list[0]?.name || '');
        setSelectedSubject(subjectData?.list[0]?.name || '');
        setSelectedType(clueTypeData?.list[0]?.name || '');
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
  }, []);

  const fetchClues = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual API call to fetch clues
      const response = await fetch('/api/clues');
      const data = await response.json();
      setClues(data);
    } catch (error) {
      console.error('Error fetching clues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimClue = async (clueId) => {
    try {
      // TODO: Implement actual API call to claim a clue
      await fetch(`/api/clues/${clueId}/claim`, {
        method: 'POST',
      });
      // Refresh clues list after claiming
      fetchClues();
    } catch (error) {
      console.error('Error claiming clue:', error);
    }
  };

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
        subject: filterData.find(f => f.id === 'subject')?.list.find(item => item.name === subjectData)?.id || 2
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
      {isLoading && <div>Loading...</div>}
      <div className="flex flex-col gap-4 mb-4">
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
        {clues.map((clue) => (
          <div key={clue.id} className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-sm">{clue.title}</h3>
              <p className="text-sm text-gray-600">{clue.description}</p>
              <div className="card-actions justify-end mt-2">
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => handleClaimClue(clue.id)}
                >
                  认领
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {clues.length === 0 && !loading && (
          <div className="text-center py-4 text-gray-500">
            暂无可用线索
          </div>
        )}
      </div>
    </div>
  );
}
