import React, { useState, useEffect } from 'react';

const SearchSettings = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchServerUrl, setSearchServerUrl] = useState('http://127.0.0.1:8088/askstream');
  const [searchCookie, setSearchCookie] = useState('');
  const [searchSessionId, setSearchSessionId] = useState('');

  useEffect(() => {
    // 从存储中读取设置
    chrome.storage.sync.get(['searchServerUrl', 'searchCookie', 'searchSessionId'], (result) => {
      if (result.searchServerUrl) {
        setSearchServerUrl(result.searchServerUrl);
      } else {
        // 如果没有存储值，保存默认值
        const defaultUrl = 'http://127.0.0.1:8088/askstream';
        chrome.storage.sync.set({ searchServerUrl: defaultUrl });
        setSearchServerUrl(defaultUrl);
      }
      
      if (result.searchCookie) {
        setSearchCookie(result.searchCookie);
      }
      if (result.searchSessionId) {
        setSearchSessionId(result.searchSessionId);
      }
    });
  }, []);

  const handleSearchServerUrlChange = (value) => {
    setSearchServerUrl(value);
    chrome.storage.sync.set({ searchServerUrl: value });
  };

  const handleSearchCookieChange = (value) => {
    setSearchCookie(value);
    chrome.storage.sync.set({ searchCookie: value });
  };

  const handleSearchSessionIdChange = (value) => {
    setSearchSessionId(value);
    chrome.storage.sync.set({ searchSessionId: value });
  };

  return (
    <div className="collapse collapse-arrow w-full">
      <input 
        type="checkbox" 
        checked={isExpanded}
        onChange={(e) => setIsExpanded(e.target.checked)}
      />
      <div className="collapse-title label-text">
        搜索设置
      </div>
      <div className="collapse-content">
        <div className="form-control w-full mt-2">
          <label className="label">
            <span className="label-text">服务器地址</span>
          </label>
          <input
            type="text"
            value={searchServerUrl}
            onChange={(e) => handleSearchServerUrlChange(e.target.value)}
            placeholder="输入搜索服务器地址"
            className="input input-bordered input-sm"
          />
        </div>
        
        <div className="form-control w-full mt-2">
          <label className="label">
            <span className="label-text">Cookie</span>
          </label>
          <textarea
            value={searchCookie}
            onChange={(e) => handleSearchCookieChange(e.target.value)}
            placeholder="输入Cookie内容"
            className="textarea textarea-bordered textarea-sm h-20"
          />
        </div>
        
        <div className="form-control w-full mt-2">
          <label className="label">
            <span className="label-text">会话ID</span>
          </label>
          <input
            type="text"
            value={searchSessionId}
            onChange={(e) => handleSearchSessionIdChange(e.target.value)}
            placeholder="输入会话ID"
            className="input input-bordered input-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default SearchSettings;
