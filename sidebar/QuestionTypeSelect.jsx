import React from 'react';

const QuestionTypeSelect = () => {
    return (
        <label className="form-control w-full max-w-xs">
            <div className="label">
                <span className="label-text">题型</span>
            </div>
            <select className="select select-sm select-bordered" defaultValue="问答">
                <option value="问答">问答</option>
                <option value="单选">单选</option>
                <option value="填空">填空</option>
            </select>
        </label>
    );
};

export default QuestionTypeSelect;
