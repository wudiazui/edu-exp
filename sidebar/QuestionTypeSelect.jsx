import React from 'react';

const QuestionTypeSelect = ({
  isImageQuestion,
  setIsImageQuestion,
  selectedValue,
  setSelectedValue,
}) => {
  return (
    <div className="flex w-full">
      <div className="flex items-center w-full">
        <span className="label-text flex-shrink-0 mx-1">题型</span>
        <select className="select select-sm select-bordered flex-grow" value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)}>
          <option value="问答">问答</option>
          <option value="单选">单选</option>
          <option value="填空">填空</option>
        </select>
      </div>
      <div class="form-control w-1/3">
        <label className="label cursor-pointer">
        <span className="label-text">图片题</span>
        <input type="checkbox"
          className="checkbox"
          checked={isImageQuestion}
          onChange={(e) => setIsImageQuestion(e.target.checked)}
        />
      </label>
      </div>
    </div>
  );
};

export default QuestionTypeSelect;
