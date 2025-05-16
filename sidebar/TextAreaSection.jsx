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
  thinkingChain = "", // 接收从父组件传递的思维链数据（文本格式）
}) => {
  const [displayMode, setDisplayMode] = useState(false);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [renderedThinkingHtml, setRenderedThinkingHtml] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [isRenderingThinking, setIsRenderingThinking] = useState(false);
  const outputRef = useRef(null);
  const thinkingOutputRef = useRef(null);
  
  // 当site为bc时自动切换为显示模式，为bd时关闭显示模式
  useEffect(() => {
    if (['bc', 'bc-no-cot'].includes(site)) {
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
  
  // 处理思维链内容的渲染
  useEffect(() => {
    if (displayMode && thinkingChain && isThinkingExpanded) {
      setIsRenderingThinking(true);
      
      // 异步渲染思维链内容
      const renderThinking = async () => {
        try {
          const html = await renderMarkdownWithMath(thinkingChain);
          setRenderedThinkingHtml(html);
        } catch (error) {
          console.error('思维链渲染错误:', error);
          // 回退到简单markdown
          setRenderedThinkingHtml(marked(thinkingChain)); 
          console.warn('思维链已回退到简单Markdown渲染，数学公式可能无法正确显示');
        } finally {
          setIsRenderingThinking(false);
        }
      };
      
      renderThinking();
    }
  }, [displayMode, thinkingChain, isThinkingExpanded]);

  // 应用额外的样式调整
  useEffect(() => {
    if (displayMode) {
      // 确保主内容区域SVG元素正确显示
      if (outputRef.current) {
        const svgs = outputRef.current.querySelectorAll('.mathjax-svg');
        if (svgs.length > 0) {
          console.log(`主内容区域找到 ${svgs.length} 个SVG元素`);
        }
      }
      
      // 确保思维链区域SVG元素正确显示
      if (thinkingOutputRef.current) {
        const svgs = thinkingOutputRef.current.querySelectorAll('.mathjax-svg');
        if (svgs.length > 0) {
          console.log(`思维链区域找到 ${svgs.length} 个SVG元素`);
        }
      }
    }
  }, [renderedHtml, renderedThinkingHtml, displayMode]);

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
              onChange={(e) => {
                setDisplayMode(e.target.checked);
              }}
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
                if (['bc', 'bc-no-cot'].includes(site) && renderedHtml) {
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
              setRenderedThinkingHtml('');
            }}
            className="btn btn-ghost btn-xs flex items-center"
          >
            清除
          </button>
          <CopyButton text={displayMode ? renderedHtml : value} />
        </div>
      </div>
      {thinkingChain && (
        <div className="mb-1 border rounded-lg overflow-hidden text-xs">
          <div 
            className="bg-base-200 p-1 flex justify-between items-center cursor-pointer"
            onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
          >
            <h3 className="text-xs font-medium">思考过程</h3>
            <div className="flex items-center">
              {isRenderingThinking && (
                <span className="text-xs text-info flex items-center gap-1 mr-2">
                  <span className="loading loading-spinner loading-xs"></span>
                  渲染中
                </span>
              )}
              <button className="btn btn-xs btn-ghost">
                {isThinkingExpanded ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {isThinkingExpanded && (
            <div className="p-2 bg-base-100 text-xs border-t">
              {displayMode ? (
                <div 
                  ref={thinkingOutputRef}
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderedThinkingHtml }}
                />
              ) : (
                <div className="whitespace-pre-wrap">
                  {thinkingChain}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
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