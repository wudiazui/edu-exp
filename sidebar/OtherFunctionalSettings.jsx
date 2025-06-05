import React, { useState, useEffect } from 'react';

const OtherFunctionalSettings = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRenderFormula, setAutoRenderFormula] = useState(true);
  const [strongFormatting, setStrongFormatting] = useState(false);

  useEffect(() => {
    // 从存储中读取设置
    chrome.storage.sync.get(['autoRenderFormula', 'strongFormatting'], (result) => {
      if (result.autoRenderFormula === undefined) {
        // 如果存储中没有值，使用并保存默认值
        const defaultValue = true;
        chrome.storage.sync.set({ autoRenderFormula: defaultValue });
        setAutoRenderFormula(defaultValue);
      } else {
        setAutoRenderFormula(result.autoRenderFormula);
      }

      if (result.strongFormatting === undefined) {
        // 如果存储中没有值，使用并保存默认值
        const defaultValue = true;
        chrome.storage.sync.set({ strongFormatting: defaultValue });
        setStrongFormatting(defaultValue);
      } else {
        setStrongFormatting(result.strongFormatting);
      }
    });
  }, []);

  const handleAutoRenderFormulaChange = (checked) => {
    setAutoRenderFormula(checked);
    // 保存设置到存储
    chrome.storage.sync.set({ autoRenderFormula: checked });
  };

  const handleStrongFormattingChange = (checked) => {
    setStrongFormatting(checked);
    // 保存设置到存储
    chrome.storage.sync.set({ strongFormatting: checked });
  };

  return (
      <div 
        className="collapse collapse-arrow w-full"
      >
        <input 
          type="checkbox" 
          checked={isExpanded}
          onChange={(e) => setIsExpanded(e.target.checked)}
        />
        <div className="collapse-title label-text">
          其他功能设置
        </div>
        <div className="collapse-content">
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">自动渲染数学公式</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={autoRenderFormula}
                onChange={(e) => handleAutoRenderFormulaChange(e.target.checked)}
              />
            </label>
          </div>
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">强力格式化</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={strongFormatting}
                onChange={(e) => handleStrongFormattingChange(e.target.checked)}
              />
            </label>
          </div>
        </div>
      </div>
  );
};

export default OtherFunctionalSettings; 