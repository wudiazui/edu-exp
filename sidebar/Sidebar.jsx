import React, { useState, useEffect } from "react";
import ApiSettingsForm from './ApiSettingsForm';
import OcrComponent from './OcrComponent';
import WorkflowComponent from './WorkflowComponent';
import QuestionSearchComponent from './QuestionSearchComponent';

export default function Main() {
  const [host, setHost] = useState('https://bedu.pingfury.top');
  const [name, setName] = useState('');
  const [activeTab, setActiveTab] = useState('settings');
  const [features, setFeatures] = useState({
    ocr: true,
    workflow: true,
    question_search: true
  });
  const [serverType, setServerType] = useState(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(features, (items) => {
        setFeatures(items);
      });
      chrome.storage.sync.get(['serverType', 'activeTab'], (result) => {
        setServerType(result.serverType || '官方服务器');
        if (result.activeTab) setActiveTab(result.activeTab);
        setIsSettingsLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    if (
      (activeTab === 'ocr' && !features.ocr) ||
      (activeTab === 'workflow' && !features.workflow) ||
      (activeTab === 'question_search' && !features.question_search)
    ) {
      if (features.ocr) setActiveTab('ocr');
      else if (features.workflow) setActiveTab('workflow');
      else if (features.question_search) setActiveTab('question_search');
      else setActiveTab('settings');
    }
  }, [features, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (chrome?.storage?.sync) {
      chrome.storage.sync.set({ activeTab: tab });
    }
  };

  return (
    <div className="w-full px-1 mt-2">
      <div className="pb-1">
        <div className="tabs tabs-boxed w-full flex justify-between">
          <a className={`tab px-2 py-1 text-sm ${activeTab === 'settings' ? 'tab-active' : ''}`} onClick={() => handleTabChange('settings')}>设置</a>
          {features.ocr && (
            <a className={`tab px-2 py-1 text-sm ${activeTab === 'ocr' ? 'tab-active' : ''}`} onClick={() => handleTabChange('ocr')}>文字识别</a>
          )}
          {features.workflow && (
            <a className={`tab px-2 py-1 text-sm ${activeTab === 'workflow' ? 'tab-active' : ''}`} onClick={() => handleTabChange('workflow')}>工作流</a>
          )}
          {features.question_search && (
            <a className={`tab px-2 py-1 text-sm ${activeTab === 'question_search' ? 'tab-active' : ''}`} onClick={() => handleTabChange('question_search')}>题干搜索</a>
          )}
        </div>
      </div>
      {activeTab === 'settings' && (
        <div className="w-full mt-2">
          <ApiSettingsForm
            host={host}
            handleHostChange={(e) => setHost(e.target.value)}
            name={name}
            handleNameChange={(e) => setName(e.target.value)}
            serverType={serverType}
            setServerType={setServerType}
            isSettingsLoading={isSettingsLoading}
          />
        </div>
      )}
      {activeTab === 'ocr' && (
        <OcrComponent host={host} uname={name} serverType={serverType} />
      )}
      {activeTab === 'workflow' && (
        <WorkflowComponent host={host} uname={name} serverType={serverType} />
      )}
      {activeTab === 'question_search' && (
        <QuestionSearchComponent host={host} uname={name} serverType={serverType} />
      )}
    </div>
  );
}
