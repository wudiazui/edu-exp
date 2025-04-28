import React, { useState, useEffect, useRef } from 'react';
import CopyButton from './CopyButton.jsx';
import { marked } from 'marked';
import { injectStylesheet } from '../tex2svg.js';

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false
});

// 标记是否已加载样式表
let stylesInjected = false;

// 加载数学公式样式表
const loadMathStylesheet = async () => {
  try {
    if (!stylesInjected) {
      // 直接使用injectStylesheet函数
      await injectStylesheet();
      stylesInjected = true;
      console.log('MathJax样式表已加载');
    }
  } catch (error) {
    console.error('加载MathJax样式表失败:', error);
  }
};

// Custom rendering for markdown with math formulas through background.js
const renderMarkdownWithMath = async (markdown) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "render_math_markdown", markdown },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (response && response.success) {
          resolve(response.html);
        } else {
          reject(new Error((response && response.error) || "未知错误"));
        }
      }
    );
  });
};

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

  // 组件挂载时加载MathJax样式表
  useEffect(() => {
    loadMathStylesheet();
  }, []);
  
  // 当site为bc时自动切换为显示模式
  useEffect(() => {
    if (site === 'bc') {
      setDisplayMode(true);
    }
  }, [site]);
  
  // 处理显示模式下的渲染
  useEffect(() => {
    if (displayMode && value) {
      setIsRendering(true);
      
      // 异步渲染以避免阻塞UI
      const render = async () => {
        try {
          // 先确保样式表已加载
          await loadMathStylesheet();
          
          const html = await renderMarkdownWithMath(value);
          setRenderedHtml(html);
        } catch (error) {
          console.error('Rendering error:', error);
          setRenderedHtml(marked(value)); // 回退到简单markdown
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