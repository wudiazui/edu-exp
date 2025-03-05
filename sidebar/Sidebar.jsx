import React, { useState, useEffect, useMemo } from "react";
import ApiSettingsForm from './ApiSettingsForm'; // 引入新组件
import QuestionAnswerForm from './QuestionAnswerForm'; // 引入新组件
import QuestionTypeSelect from './QuestionTypeSelect'; // 引入新组件
import CopyButton from './CopyButton'; // 引入新组件
import OcrComponent from './OcrComponent'; // 引入新组件
import ClueClaimingComponent from './ClueClaimingComponent'; // 引入线索认领组件

export default function Main() {
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [analysis, setAnalysis] = React.useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [isCompleteeing, setIsCompleteeing] = useState(false);
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [host, setHost] = React.useState('');
  const [name, setName] = useState('');
  const [activeTab, setActiveTab] = useState('solving');
  const [isImageQuestion, setIsImageQuestion] = useState(false);
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [selectedValue, setSelectedValue] = useState('问答');
  const [isSwapActive, setIsSwapActive] = useState(false);
  const [subject, setSubject] = useState('shuxue'); // 初始化 subject
  const [features, setFeatures] = useState({
    jieti: true,
    ocr: true,
    "clue-claiming": false
  });

  React.useEffect(() => {
    // 监听来自 background 的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SET_QUESTION') {
        setQuestion(message.data);
        setIsImageQuestion(false);
        setSelectedImage(null);
      }
    });
  }, []);

  React.useEffect(() => {
    // 从 Chrome 存储中加载 host
    chrome.storage.sync.get(['host'], (result) => {
      if (result.host) {
        setHost(result.host);
      } else {
        setHost('https://bedu.pingfury.top');
      }
    });
  }, []);

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleFormat = async () => {
    setIsFormatting(true);
    try {
      const response = await chrome.runtime.sendMessage(
        { type: 'FORMAT_QUESTION', data: {'topic': question, 'discipline': subject}, host: host, uname: name }
      );
      if (response && response.formatted) {
        setQuestion(response.formatted);
      }
      // 处理其他响应...
    } finally {
      setIsFormatting(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleteeing(true);
    try {
      const response = await chrome.runtime.sendMessage(
        { type: 'TOPIC_COMPLETE', data: {'topic': question, 'discipline': subject}, host: host, uname: name }
      );
      if (response && response.formatted) {
        setQuestion(response.formatted);
      }
      // 处理其他响应...
    } finally {
      setIsCompleteeing(false);
    }
  };

  const handleHostChange = (e) => {
    const newHost = e.target.value;
    setHost(newHost);
    // 更新 Chrome 存储
    chrome.storage.sync.set({ host: newHost }, () => {
    });
  };

  const handleGenerateAnswer = async () => {
    setIsGeneratingAnswer(true);
    try {
      const response = await chrome.runtime.sendMessage(
        {
          type: 'TOPIC_ANSWER',
          host: host,
          uname: name,
          data: {'topic': question, 'discipline': subject, 'image_data': selectedImage, 'topic_type': selectedValue }
        }
      );
      if (response && response.formatted) {
        setAnswer(response.formatted);
      }
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const handleGenerateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    try {
      const response = await chrome.runtime.sendMessage(
        {
          type: 'TOPIC_ANALYSIS',
          host: host,
          uname: name,
          data: {'topic': question, 'answer': answer, 'discipline': subject, 'image_data': selectedImage, 'topic_type': selectedValue}
        }
      );
      if (response && response.formatted) {
        setAnalysis(response.formatted);
      }
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
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
    if (
      (activeTab === 'solving' && !features.jieti) ||
      (activeTab === 'ocr' && !features.ocr) ||
      (activeTab === 'clue-claiming' && !features["clue-claiming"])
    ) {
      // Find the first enabled tab or default to settings
      if (features.jieti) {
        setActiveTab('solving');
      } else if (features.ocr) {
        setActiveTab('ocr');
      } else if (features["clue-claiming"]) {
        setActiveTab('clue-claiming');
      } else {
        setActiveTab('settings');
      }
    }
  }, [features, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // 更新 Chrome 存储
    chrome.storage.sync.set({ activeTab: tab });
  };

  const handleSwapToggle = (newValue) => {
    setIsSwapActive(newValue);
    // 更新 Chrome 存储
    chrome.storage.sync.set({ isSwapActive: newValue });
  };

  useEffect(() => {
    // 从 Chrome 存储中加载 isSwapActive
    chrome.storage.sync.get(['isSwapActive'], (result) => {
      if (result.isSwapActive !== undefined) {
        setIsSwapActive(result.isSwapActive);
      }
    });
  }, []);

  useEffect(() => {
    setSubject(isSwapActive ? 'yuwen' : 'shuxue'); // 根据 isSwapActive 的值更新 subject
  }, [isSwapActive]); // 监听 isSwapActive 的变化

  // Load feature settings from Chrome storage
  useEffect(() => {
    chrome.storage.sync.get(['jieti', 'ocr', 'clue-claiming'], (result) => {
      const loadedFeatures = {
        jieti: result.jieti !== undefined ? result.jieti : true,
        ocr: result.ocr !== undefined ? result.ocr : true,
        "clue-claiming": result["clue-claiming"] !== undefined ? result["clue-claiming"] : false
      };
      setFeatures(loadedFeatures);
    });
  }, []);

  return (<div className="container max-auto px-1 mt-2">
    <div className="tabs tabs-boxed">
      <a className={`tab ${activeTab === 'settings' ? 'tab-active' : ''}`} onClick={() => handleTabChange('settings')}>设置</a>
      {features.jieti && (
        <a className={`tab ${activeTab === 'solving' ? 'tab-active' : ''}`} onClick={() => handleTabChange('solving')}>解题</a>
      )}
      {features.ocr && (
        <a className={`tab ${activeTab === 'ocr' ? 'tab-active' : ''}`} onClick={() => handleTabChange('ocr')}>文字识别</a>
      )}
      {features["clue-claiming"] && (
        <a className={`tab ${activeTab === 'clue-claiming' ? 'tab-active' : ''}`} onClick={() => handleTabChange('clue-claiming')}>线索认领</a>
      )}
    </div>
            {activeTab === 'settings' && (
              <div className="w-full mt-2">
                <ApiSettingsForm
                  host={host}
                  handleHostChange={handleHostChange}
                  name={name}
                  handleNameChange={handleNameChange}
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
                  isSwapActive={isSwapActive}
                  setIsSwapActive={handleSwapToggle}
                />
            )}
            {activeTab === 'ocr' && (
              <OcrComponent
                host={host}
                uname={name}
              />
            )}
            {activeTab === 'clue-claiming' && (
              <ClueClaimingComponent />
            )}
          </div>)
}
