import React, { useState } from 'react';
import CopyButton from './CopyButton.jsx';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import 'katex/dist/katex.min.css';
import katex from 'katex';

// Configure marked with KaTeX extension
marked.use(markedKatex({
  throwOnError: false,
  displayMode: true,
  nonStandard: true,
  macros: {
    "\\RR": "\\mathbb{R}",
    "\\NN": "\\mathbb{N}",
    "\\ZZ": "\\mathbb{Z}",
    "\\QQ": "\\mathbb{Q}",
    "\\CC": "\\mathbb{C}"
  }
}));

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false
});


const TextAreaSection = ({
  title,
  value,
  onChange,
  placeholder,
  autoRenderFormula,
  onAutoRenderFormulaChange,
  onFill,
  onClear,
  displayModeHint,
}) => {
  const [displayMode, setDisplayMode] = useState(false);

  return (
    <div className="w-full mt-2">
      <div className="label flex justify-between items-center">
        <span className="label-text">{title}</span>
        <div className="flex gap-1 items-center">
          <div className="tooltip tooltip-bottom flex items-center" data-tip={displayModeHint || "显示模式 - 渲染Markdown和数学公式"}>
            <input
              type="checkbox"
              className="toggle toggle-xs toggle-secondary"
              checked={displayMode}
              onChange={(e) => setDisplayMode(e.target.checked)}
            />
          </div>
          <div className="tooltip tooltip-bottom flex items-center" data-tip="自动渲染数学公式">
            <input
              type="checkbox"
              className="toggle toggle-xs toggle-accent"
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
          <CopyButton text={displayMode ? marked(value) : value} />
        </div>
      </div>
      {displayMode ? (
        <div
          className="textarea textarea-bordered textarea-lg w-full h-full min-h-40 overflow-auto p-4 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: marked(value) }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="textarea textarea-bordered textarea-lg w-full h-full min-h-40 p-4"
        />
      )}
    </div>
  );
};

export default TextAreaSection; 