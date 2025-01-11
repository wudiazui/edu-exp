import React from 'react';
import CopyButton from './CopyButton.jsx'; // 确保引入 CopyButton 组件
import Select from './QuestionTypeSelect.jsx'; // 确保引入 Select 组件

const QuestionAnswerForm = ({
    question,
    handleQuestionChange,
    imageUrl,
    setImageUrl,
    answer,
    setAnswer,
    analysis,
    setAnalysis,
    isFormatting,
    handleFormat,
    isGeneratingAnswer,
    handleGenerateAnswer,
    isGeneratingAnalysis,
    handleGenerateAnalysis,
}) => {
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
                    className="textarea textarea-bordered textarea-lg w-full h-full"
                ></textarea>
                {/*
                <div className="form-control w-full max-w-xs mt-2">
                    <label className="label">
                        <span className="label-text">Image URL</span>
                    </label>
                    <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="输入 Image URL"
                        className="input input-bordered input-sm"
                    />
                </div>
                */}
            </div>
            <div className="w-full mt-2 flex flex-col items-center border border-gray-300 rounded-lg">
                <Select />
                <div className="join m-2">
                    <button
                        className={`join-item ${isFormatting ? 'loading loading-spinner loading-sm' : 'btn btn-sm'}`}
                        onClick={handleFormat}
                        disabled={isFormatting}
                    >
                        {isFormatting ? '' : '整理题干'}
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
                    className="textarea textarea-bordered textarea-lg w-full h-full"
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
                    className="textarea textarea-bordered textarea-lg w-full h-full"
                ></textarea>
            </div>
        </>
    );
};

export default QuestionAnswerForm;
