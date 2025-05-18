import React, { useState, useEffect } from 'react';
import CopyButton from './CopyButton.jsx'; // 确保引入 CopyButton 组件
import Select from './QuestionTypeSelect.jsx'; // 确保引入 Select 组件
import TextAreaSection from './TextAreaSection.jsx';
import ImageUploader from './ImageUploader.jsx'; // 引入新的ImageUploader组件

const QuestionAnswerForm = ({
  question = "",
  setQuestion,
  handleQuestionChange,
  answer = "",
  setAnswer,
  analysis = "",
  setAnalysis,
  answerThinkingChain = "",
  analysisThinkingChain = "",
  isFormatting,
  handleFormat,
  isCompleteeing,
  handleComplete,
  isGeneratingAnswer,
  handleGenerateAnswer,
  isGeneratingAnalysis,
  handleGenerateAnalysis,
  isImageQuestion = false,
  setIsImageQuestion,
  selectedImage = "",
  setSelectedImage,
  selectedValue = "",
  setSelectedValue,
  host,
  uname,
  subject = "",
  setSubject,
  serverType,
  gradeLevel = "",
  setGradeLevel,
  site = "bd",
  setSite,
}) => {
  const [autoRenderFormula, setAutoRenderFormula] = useState(true);

  useEffect(() => {
    // 从存储中读取设置
    chrome.storage.sync.get(['autoRenderFormula'], (result) => {
      setAutoRenderFormula(result.autoRenderFormula ?? true);
    });
  }, []);

  const handleAutoRenderFormulaChange = (e) => {
    const checked = e.target.checked;
    setAutoRenderFormula(checked);
    // 保存设置到存储
    chrome.storage.sync.set({ autoRenderFormula: checked });
  };

  return (
    <>
      <div className="w-full mt-2">
        <select 
          className="select select-bordered select-sm w-full mb-2"
          value={site || "bd"}
          onChange={(e) => setSite(e.target.value)}
        >
          <option value="bd">百度</option>
          <option value="bc">百川-cot</option>
          <option value="bc-no-cot">百川-no-cot</option>
        </select>
        <div className="label flex justify-between items-center">
          <span className="label-text">题干</span>
          <div className="flex gap-1 items-center">
            <button
              onClick={() => setQuestion('')}
              className="btn btn-ghost btn-xs flex items-center"
            >
              清除
            </button>
            <CopyButton text={question} />
          </div>
        </div>
        <textarea
          value={question}
          onChange={handleQuestionChange}
          placeholder="题干"
          className="textarea textarea-bordered textarea-lg w-full h-full min-h-40 text-sm"
        ></textarea>
        {isImageQuestion && (
          <div className="form-control w-full mt-2">
            <ImageUploader
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              placeholder="粘贴图片"
              showDeleteButton={true}
            />
          </div>
        )}
      </div>
      <div className="w-full mt-2 flex flex-col items-center border border-gray-300 rounded-lg">
        <Select
          isImageQuestion={isImageQuestion}
          setIsImageQuestion={setIsImageQuestion}
          selectedValue={selectedValue}
          setSelectedValue={setSelectedValue}
          host={host}
          uname={uname}
          subject={subject}
          setSubject={setSubject}
          serverType={serverType}
          gradeLevel={gradeLevel}
          setGradeLevel={setGradeLevel}
        />
        <div className="join m-2">
          {!['bc', 'bc-no-cot'].includes(site) && (
            <>
              <button
                className={`join-item ${isFormatting ? 'loading loading-spinner loading-sm' : 'btn btn-sm'}`}
                onClick={handleFormat}
                disabled={isFormatting || isCompleteeing || isGeneratingAnswer || isGeneratingAnalysis}
              >
                {isFormatting ? '' : '整理题干'}
              </button>
              <button
                className={`join-item ${isCompleteeing ? 'loading loading-spinner loading-sm' : 'btn btn-sm'}`}
                onClick={handleComplete}
                disabled={isFormatting || isCompleteeing || isGeneratingAnswer || isGeneratingAnalysis}
              >
                {isCompleteeing ? '' : '残题补全'}
              </button>
            </>
          )}
          <button
            className={`join-item ${isGeneratingAnswer ? 'loading loading-spinner loading-sm' : 'btn btn-sm'}`}
            onClick={handleGenerateAnswer}
            disabled={isFormatting || isCompleteeing || isGeneratingAnswer || isGeneratingAnalysis}
          >
            {isGeneratingAnswer ? '' : ['bc', 'bc-no-cot'].includes(site) ? '题目详解' : '生成解答'}
          </button>
          <button
            className={`join-item ${isGeneratingAnalysis ? 'loading loading-spinner loading-sm' : 'btn btn-sm'}`}
            onClick={handleGenerateAnalysis}
            disabled={isFormatting || isCompleteeing || isGeneratingAnswer || isGeneratingAnalysis}
          >
            {isGeneratingAnalysis ? '' : ['bc', 'bc-no-cot'].includes(site) ? '思路点拨' : '生成解析'}
          </button>
        </div>
      </div>
      <TextAreaSection
        title={['bc', 'bc-no-cot'].includes(site) ? '题目详解' : '解答'}
        value={answer}
        onChange={setAnswer}
        placeholder={['bc', 'bc-no-cot'].includes(site) ? '题目详解' : '解答'}
        autoRenderFormula={autoRenderFormula}
        onAutoRenderFormulaChange={handleAutoRenderFormulaChange}
        onFill={(content) => {
          chrome.runtime.sendMessage({
            type: "answer",
            text: content || answer
          });
        }}
        onClear={() => setAnswer('')}
        site={site}
        thinkingChain={answerThinkingChain}
        gradeLevel={gradeLevel}
      />
      <TextAreaSection
        title={['bc', 'bc-no-cot'].includes(site) ? '思路点拨' : '解析'}
        value={analysis}
        onChange={setAnalysis}
        placeholder={['bc', 'bc-no-cot'].includes(site) ? '思路点拨' : '解析'}
        autoRenderFormula={autoRenderFormula}
        onAutoRenderFormulaChange={handleAutoRenderFormulaChange}
        onFill={(content) => {
          chrome.runtime.sendMessage({
            type: "analysis",
            text: content || analysis
          });
        }}
        onClear={() => setAnalysis('')}
        site={site}
        thinkingChain={analysisThinkingChain}
        gradeLevel={gradeLevel}
      />
    </>
  );
};

export default QuestionAnswerForm;
