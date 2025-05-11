import React, { useState, useEffect, useRef } from 'react';
import CopyButton from './CopyButton.jsx';
import { marked } from 'marked';
import { renderMarkdownWithMath } from '../markdown-renderer.js';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false
});

// 移除本地渲染函数，直接使用导入的renderMarkdownWithMath

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
  site,
}) => {
  const [displayMode, setDisplayMode] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const outputRef = useRef(null);
  
  // 当site为bc时自动切换为显示模式，为bd时关闭显示模式
  useEffect(() => {
    if (site === 'bc') {
      setDisplayMode(true);
    } else if (site === 'bd') {
      setDisplayMode(false);
    }
  }, [site]);
  
  // 处理显示模式下的渲染
  useEffect(() => {
    if (displayMode && value) {
      setIsRendering(true);
      
      // 异步渲染以避免阻塞UI
      const render = async () => {
        try {
          const html = await renderMarkdownWithMath(value);
          setRenderedHtml(html);
        } catch (error) {
          console.error('Rendering error:', error);
          // 回退到简单markdown，不包含数学公式渲染
          setRenderedHtml(marked(value)); 
          // 显示错误提示
          console.warn('已回退到简单Markdown渲染，数学公式可能无法正确显示');
        } finally {
          setIsRendering(false);
        }
      };
      
      render();
    }
  }, [displayMode, value]);

  // 应用额外的样式调整
  useEffect(() => {
    if (displayMode && outputRef.current) {
      // 确保SVG元素正确显示
      const svgs = outputRef.current.querySelectorAll('.mathjax-svg');
      if (svgs.length > 0) {
        console.log(`找到 ${svgs.length} 个SVG元素`);
      }
    }
  }, [renderedHtml, displayMode]);

  return (
    <div className="w-full mt-2">
      <div className="label flex justify-between items-center">
        <span className="label-text">{title}</span>
        <div className="flex gap-1 items-center">
          {isRendering && (
            <span className="text-xs text-info flex items-center gap-1">
              <span className="loading loading-spinner loading-xs"></span>
              渲染中
            </span>
          )}
          <div className="tooltip tooltip-bottom flex items-center" data-tip={displayModeHint || "预览模式：显示渲染后的Markdown和数学公式"}>
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
              onClick={() => {
                // 当site为bc时，使用渲染后的HTML内容
                if (site === 'bc' && renderedHtml) {
                  onFill(renderedHtml);
                } else {
                  onFill(value);
                }
              }}
              className="btn btn-ghost btn-xs flex items-center"
            >
              填入
            </button>
          </div>
          <button
            onClick={() => {
              onClear();
              setRenderedHtml('');
            }}
            className="btn btn-ghost btn-xs flex items-center"
          >
            清除
          </button>
          <CopyButton text={displayMode ? renderedHtml : value} />
        </div>
      </div>
      {displayMode ? (
        <div
          ref={outputRef}
          className="textarea textarea-bordered textarea-lg w-full h-full min-h-40 overflow-auto p-4 prose prose-sm max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="textarea textarea-bordered textarea-lg w-full h-full min-h-40 p-4 text-sm"
        />
      )}
    </div>
  );
};

export default TextAreaSection; 