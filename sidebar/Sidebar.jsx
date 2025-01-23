import React, { useState, useEffect } from "react";
import ApiSettingsForm from './ApiSettingsForm'; // 引入新组件
import QuestionAnswerForm from './QuestionAnswerForm'; // 引入新组件
import QuestionTypeSelect from './QuestionTypeSelect'; // 引入新组件
import CopyButton from './CopyButton'; // 引入新组件
import OcrComponent from './OcrComponent'; // 引入新组件

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
        setHost('http://127.0.0.1:8000');
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
        { type: 'FORMAT_QUESTION', data: {'topic': question}, host: host, uname: name }
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
        { type: 'TOPIC_COMPLETE', data: {'topic': question}, host: host, uname: name }
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
          data: {'topic': question, 'image_data': selectedImage, 'topic_type': selectedValue }
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
          data: {'topic': question, 'answer': answer, 'image_data': selectedImage, 'topic_type': selectedValue}
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // 更新 Chrome 存储
    chrome.storage.sync.set({ activeTab: tab });
  };


  return (<div className="container max-auto px-1">
            <div className="tabs tabs-boxed">
              <a className={`tab ${activeTab === 'settings' ? 'tab-active' : ''}`} onClick={() => handleTabChange('settings')}>设置</a>
              <a className={`tab ${activeTab === 'solving' ? 'tab-active' : ''}`} onClick={() => handleTabChange('solving')}>解题</a>
              <a className={`tab ${activeTab === 'ocr' ? 'tab-active' : ''}`} onClick={() => handleTabChange('ocr')}>文字识别</a>
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
                />
            )}
            {activeTab === 'ocr' && (
                <div className="w-full mt-2">
                  <OcrComponent host={host} uname={name} />
                </div>
            )}
          </div>)
}
