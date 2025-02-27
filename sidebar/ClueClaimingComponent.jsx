import React, { useState, useEffect } from 'react';

export default function ClueClaimingComponent() {
  const [clues, setClues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterData, setFilterData] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        const clueTypeData = response.data.filter.find(f => f.id === 'clue_type');
        
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

  return (
    <div className="w-full mt-2">
      {isLoading && <div>Loading...</div>}
      <div className="flex flex-col gap-4 mb-4">
        <div className="form-control w-full">
          <select 
            className="select select-bordered w-full" 
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
          >
            {filterData?.find(f => f.id === 'step')?.list.map(item => (
              <option key={item.id} value={item.name}>{item.name}</option>
            ))}
          </select>
        </div>

        <div className="form-control w-full">
          <select 
            className="select select-bordered w-full"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {filterData?.find(f => f.id === 'subject')?.list.map(item => (
              <option key={item.id} value={item.name}>{item.name}</option>
            ))}
          </select>
        </div>

        <div className="form-control w-full">
          <select 
            className="select select-bordered w-full"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {filterData?.find(f => f.id === 'clue_type')?.list.map(item => (
              <option key={item.id} value={item.name}>{item.name}</option>
            ))}
          </select>
        </div>

        <button 
          className="btn btn-primary w-full"
          onClick={fetchClues}
          disabled={loading}
        >
          {loading ? '加载中...' : '刷新'}
        </button>
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
