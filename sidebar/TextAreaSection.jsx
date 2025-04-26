import React from 'react';
import CopyButton from './CopyButton.jsx';

const TextAreaSection = ({
  title,
  value,
  onChange,
  placeholder,
  autoRenderFormula,
  onAutoRenderFormulaChange,
  onFill,
  onClear,
}) => {
  return (
    <div className="w-full mt-2">
      <div className="label flex justify-between items-center">
        <span className="label-text">{title}</span>
        <div className="flex gap-1 items-center">
          <div className="tooltip tooltip-bottom flex items-center" data-tip="自动渲染数学公式">
            <input
              type="checkbox"
              className="toggle toggle-xs toggle-primary"
              checked={autoRenderFormula}
              onChange={onAutoRenderFormulaChange}
            />
          </div>
          <div className="tooltip tooltip-bottom" data-tip={`填入到[${title}]编辑器`}>
            <button
              onClick={onFill}
              className="btn btn-ghost btn-xs flex items-center"
            >
              填入
            </button>
          </div>
          <button
            onClick={onClear}
            className="btn btn-ghost btn-xs flex items-center"
          >
            清除
          </button>
          <CopyButton text={value} />
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder={placeholder}
        className="textarea textarea-bordered textarea-lg w-full h-full min-h-40"
      ></textarea>
    </div>
  );
};

export default TextAreaSection; 