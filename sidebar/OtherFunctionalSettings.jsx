import React, { useState, useEffect } from 'react';

const OtherFunctionalSettings = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRenderFormula, setAutoRenderFormula] = useState(true);

  useEffect(() => {
    // 从存储中读取设置
    chrome.storage.sync.get(['autoRenderFormula'], (result) => {
      setAutoRenderFormula(result.autoRenderFormula ?? true);
    });
  }, []);

  const handleAutoRenderFormulaChange = (checked) => {
    setAutoRenderFormula(checked);
    // 保存设置到存储
    chrome.storage.sync.set({ autoRenderFormula: checked });
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
        </div>
      </div>
  );
};

export default OtherFunctionalSettings; 