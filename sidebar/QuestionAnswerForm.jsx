import React from 'react';
import CopyButton from './CopyButton.jsx'; // 确保引入 CopyButton 组件
import Select from './QuestionTypeSelect.jsx'; // 确保引入 Select 组件

const QuestionAnswerForm = ({
  question,
  handleQuestionChange,
  answer,
  setAnswer,
  analysis,
  setAnalysis,
  isFormatting,
  handleFormat,
  isCompleteeing,
  handleComplete,
  isGeneratingAnswer,
  handleGenerateAnswer,
  isGeneratingAnalysis,
  handleGenerateAnalysis,
  isImageQuestion,
  setIsImageQuestion,
  selectedImage,
  setSelectedImage,
  selectedValue,
  setSelectedValue,
  host,
  uname,
  isSwapActive,
  setIsSwapActive,
}) => {

  const onPaste = (event) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImage(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
        <>
            <div className="w-full mt-2">
                <div className="label flex justify-between items-center">
                    <span className="label-text">题干</span>
                    <CopyButton text={question} />
                </div>
                <textarea
                    value={question}
                    onChange={handleQuestionChange}
                    placeholder="题干"
                    className="textarea textarea-bordered textarea-lg w-full h-full min-h-40"
                ></textarea>
                {isImageQuestion && (
                  <div className="form-control w-full">
                    <div className="w-full">
                      <input type="text" onPaste={onPaste} placeholder="粘贴图片" className="input input-sm input-bordered w-full" />
                    </div>
                    <div className="w-full mt-2 p-2 rounded-lg border">
                      {selectedImage ? (
                        <img src={selectedImage} alt="Selected" className="img object-cover" />
                      ) : (
                        <div className="skeleton w-full h-24"></div>
                      )}
                    </div>
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
                  isSwapActive={isSwapActive}
                  setIsSwapActive={setIsSwapActive}
                />
                <div className="join m-2">
                  <button
                        className={`join-item ${isFormatting ? 'loading loading-spinner loading-sm' : 'btn btn-sm'}`}
                        onClick={handleFormat}
                        disabled={isFormatting}
                    >
                        {isFormatting ? '' : '整理题干'}
                    </button>
                  <button
                    className={`join-item ${isCompleteeing ? 'loading loading-spinner loading-sm' : 'btn btn-sm'}`}
                    onClick={handleComplete}
                    disabled={isCompleteeing}
                  >
                    {isCompleteeing ? '' : '残题补全'}
                        </button>
                        <button
                        className={`join-item ${isGeneratingAnswer ? 'loading loading-spinner loading-sm' : 'btn btn-sm'}`}
                        onClick={handleGenerateAnswer}
                        disabled={isGeneratingAnswer}
                    >
                        {isGeneratingAnswer ? '' : '生成解答'}
                    </button>
                    <button
                        className={`join-item ${isGeneratingAnalysis ? 'loading loading-spinner loading-sm' : 'btn btn-sm'}`}
                        onClick={handleGenerateAnalysis}
                        disabled={isGeneratingAnalysis}
                    >
                        {isGeneratingAnalysis ? '' : '生成解析'}
                    </button>
                </div>
            </div>
            <div className="w-full mt-2">
                <div className="label flex justify-between items-center">
                    <span className="label-text">解答</span>
                    <CopyButton text={answer} />
                </div>
                <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="解答"
                    className="textarea textarea-bordered textarea-lg w-full h-full min-h-40"
                ></textarea>
            </div>
            <div className="w-full mt-2">
                <div className="label flex justify-between items-center">
                    <span className="label-text">解析</span>
                    <CopyButton text={analysis} />
                </div>
                <textarea
                    value={analysis}
                    onChange={(e) => setAnalysis(e.target.value)}
                    placeholder="解析"
                    className="textarea textarea-bordered textarea-lg w-full h-full min-h-40"
                ></textarea>
            </div>
        </>
    );
};

export default QuestionAnswerForm;
