import React, { useEffect, useState } from "react";
import katex from "katex";

// 常用LaTeX符号列表
const LATEX_SYMBOLS = {
  "数学运算": [
    { symbol: "±", latex: "\\pm" },
    { symbol: "×", latex: "\\times" },
    { symbol: "÷", latex: "\\div" },
    { symbol: "≠", latex: "\\neq" },
    { symbol: "≈", latex: "\\approx" },
    { symbol: "≤", latex: "\\leq" },
    { symbol: "≥", latex: "\\geq" },
    { symbol: "∞", latex: "\\infty" },
    { symbol: "·", latex: "\\cdot" },
    { symbol: "∗", latex: "\\ast" },
    { symbol: "⊕", latex: "\\oplus" },
    { symbol: "⊗", latex: "\\otimes" },
    { symbol: "⊙", latex: "\\odot" }
  ],
  "比较符号": [
    { symbol: "<", latex: "<" },
    { symbol: ">", latex: ">" },
    { symbol: "≤", latex: "\\leq" },
    { symbol: "≥", latex: "\\geq" },
    { symbol: "≪", latex: "\\ll" },
    { symbol: "≫", latex: "\\gg" },
    { symbol: "≲", latex: "\\lesssim" },
    { symbol: "≳", latex: "\\gtrsim" }
  ],
  "括号": [
    { symbol: "(", latex: "(" },
    { symbol: ")", latex: ")" },
    { symbol: "[", latex: "[" },
    { symbol: "]", latex: "]" },
    { symbol: "{", latex: "\\{" },
    { symbol: "}", latex: "\\}" },
    { symbol: "⟨", latex: "\\langle" },
    { symbol: "⟩", latex: "\\rangle" },
    { symbol: "⌈", latex: "\\lceil" },
    { symbol: "⌉", latex: "\\rceil" },
    { symbol: "⌊", latex: "\\lfloor" },
    { symbol: "⌋", latex: "\\rfloor" }
  ],
  "圆圈": [
    { symbol: "◯", latex: "\\bigcirc" },
    { symbol: "○", latex: "\\circ" },
    { symbol: "⊙", latex: "\\odot" },
    { symbol: "⊕", latex: "\\oplus" },
    { symbol: "⊗", latex: "\\otimes" },
    { symbol: "⊖", latex: "\\ominus" },
    { symbol: "⊘", latex: "\\oslash" }
  ],
  "逻辑符号": [
    { symbol: "∧", latex: "\\wedge" },
    { symbol: "∨", latex: "\\vee" },
    { symbol: "¬", latex: "\\neg" },
    { symbol: "⇒", latex: "\\Rightarrow" },
    { symbol: "⇔", latex: "\\Leftrightarrow" },
    { symbol: "∀", latex: "\\forall" },
    { symbol: "∃", latex: "\\exists" },
    { symbol: "∄", latex: "\\nexists" }
  ],
  "集合符号": [
    { symbol: "∈", latex: "\\in" },
    { symbol: "∉", latex: "\\notin" },
    { symbol: "⊂", latex: "\\subset" },
    { symbol: "⊆", latex: "\\subseteq" },
    { symbol: "⊃", latex: "\\supset" },
    { symbol: "⊇", latex: "\\supseteq" },
    { symbol: "∪", latex: "\\cup" },
    { symbol: "∩", latex: "\\cap" },
    { symbol: "∅", latex: "\\emptyset" }
  ],
  "几何符号": [
    { symbol: "∠", latex: "\\angle" },
    { symbol: "△", latex: "\\triangle" },
    { symbol: "□", latex: "\\square" },
    { symbol: "∥", latex: "\\parallel" },
    { symbol: "⊥", latex: "\\perp" },
    { symbol: "∫", latex: "\\int" },
    { symbol: "∬", latex: "\\iint" }
  ],
  "箭头": [
    { symbol: "→", latex: "\\rightarrow" },
    { symbol: "←", latex: "\\leftarrow" },
    { symbol: "↔", latex: "\\leftrightarrow" },
    { symbol: "⇒", latex: "\\Rightarrow" },
    { symbol: "⇐", latex: "\\Leftarrow" },
    { symbol: "⇔", latex: "\\Leftrightarrow" },
    { symbol: "↑", latex: "\\uparrow" },
    { symbol: "↓", latex: "\\downarrow" }
  ],
  "希腊字母": [
    { symbol: "α", latex: "\\alpha" },
    { symbol: "β", latex: "\\beta" },
    { symbol: "γ", latex: "\\gamma" },
    { symbol: "δ", latex: "\\delta" },
    { symbol: "ε", latex: "\\epsilon" },
    { symbol: "θ", latex: "\\theta" },
    { symbol: "λ", latex: "\\lambda" },
    { symbol: "μ", latex: "\\mu" },
    { symbol: "π", latex: "\\pi" },
    { symbol: "σ", latex: "\\sigma" },
    { symbol: "φ", latex: "\\phi" },
    { symbol: "ω", latex: "\\omega" }
  ],
  "关系符号": [
    { symbol: "≡", latex: "\\equiv" },
    { symbol: "≅", latex: "\\cong" },
    { symbol: "≈", latex: "\\approx" },
    { symbol: "∼", latex: "\\sim" },
    { symbol: "≃", latex: "\\simeq" },
    { symbol: "∝", latex: "\\propto" }
  ]
};

const CharacterInsertionSettings = () => {
  const [shortcuts, setShortcuts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentShortcut, setCurrentShortcut] = useState({ name: '', character: '', keyboardShortcut: '', latex: '', wrapWithDollar: true });
  const [editingIndex, setEditingIndex] = useState(-1);
  const [mode, setMode] = useState('add');
  const [latexPreview, setLatexPreview] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [selectedCategory, setSelectedCategory] = useState('数学运算');

  useEffect(() => {
    // Load shortcuts from Chrome storage when component mounts
    chrome.storage.sync.get(['shortcuts'], (result) => {
      if (result.shortcuts) {
        setShortcuts(result.shortcuts);
      }
    });
  }, []);

  useEffect(() => {
    // Update LaTeX preview when character changes
    try {
      if (currentShortcut.latex) {
        const html = katex.renderToString(currentShortcut.latex, {
          throwOnError: false,
          displayMode: true
        });
        setLatexPreview(html);
      } else {
        setLatexPreview('');
      }
    } catch (error) {
      console.error('LaTeX rendering error:', error);
      setLatexPreview('Invalid LaTeX formula');
    }
  }, [currentShortcut.latex]);

  const handleKeyDown = (e) => {
    e.preventDefault();
    const keys = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');
    if (e.key && e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt') {
      keys.push(e.key.toUpperCase());
    }
    const shortcutStr = keys.join('+');
    setCurrentShortcut(prev => ({ ...prev, keyboardShortcut: shortcutStr }));
  };

  const handleSaveShortcut = () => {
    if (!currentShortcut.name || (!currentShortcut.character && !currentShortcut.latex)) return;

    const shortcutToSave = {
      ...currentShortcut,
      character: currentShortcut.latex 
        ? (currentShortcut.wrapWithDollar ? `$${currentShortcut.latex}$` : currentShortcut.latex)
        : currentShortcut.character
    };

    let updatedShortcuts;
    if (mode === 'add') {
      updatedShortcuts = [...shortcuts, shortcutToSave];
    } else {
      updatedShortcuts = shortcuts.map((shortcut, i) => {
        if (i === editingIndex) {
          return shortcutToSave;
        }
        return shortcut;
      });
    }

    setShortcuts(updatedShortcuts);
    chrome.storage.sync.set({ shortcuts: updatedShortcuts });
    chrome.runtime.sendMessage({
      type: 'UPDATE_SHORTCUTS',
      shortcuts: updatedShortcuts
    });
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentShortcut({ name: '', character: '', keyboardShortcut: '', latex: '', wrapWithDollar: true });
    setLatexPreview('');
    setEditingIndex(-1);
  };

  const handleDeleteShortcut = (index) => {
    const updatedShortcuts = shortcuts.filter((_, i) => i !== index);
    setShortcuts(updatedShortcuts);
    chrome.storage.sync.set({ shortcuts: updatedShortcuts });
    chrome.runtime.sendMessage({
      type: 'UPDATE_SHORTCUTS',
      shortcuts: updatedShortcuts
    });
  };

  const handleEditShortcut = (index) => {
    setMode('edit');
    setEditingIndex(index);
    const shortcut = shortcuts[index];
    const isLatex = shortcut.character.startsWith('$') && shortcut.character.endsWith('$');
    const latex = isLatex ? shortcut.character.slice(1, -1) : '';
    
    setInputMode(isLatex ? 'latex' : 'text');
    setCurrentShortcut({
      ...shortcut,
      latex,
      character: latex ? '' : shortcut.character,
      wrapWithDollar: isLatex
    });
    setIsModalOpen(true);
  };

  const handleAddNewShortcut = () => {
    setMode('add');
    setEditingIndex(-1);
    setCurrentShortcut({ name: '', character: '', keyboardShortcut: '', latex: '', wrapWithDollar: true });
    setIsModalOpen(true);
  };

  const handleSymbolSelect = (latex) => {
    setCurrentShortcut(prev => ({
      ...prev,
      latex,
      character: ''
    }));
  };

  return (
    <div className="collapse collapse-arrow w-full mt-2">
      <input type="checkbox" />
      <div className="collapse-title label-text">
        字符插入设置
      </div>
      <div className="collapse-content overflow-x-auto whitespace-nowrap">
        <button
          className="btn btn-primary btn-sm mb-4"
          onClick={handleAddNewShortcut}
        >
          添加新字符
        </button>

        {shortcuts.length > 0 && (
          <div className="relative rounded-lg border border-base-300">
            <div className="overflow-x-auto overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-base-300">
              <table className="table table-zebra w-full">
                <thead className="sticky top-0 bg-base-200 shadow-sm z-10">
                  <tr>
                    <th className="bg-base-200 font-semibold">名称</th>
                    <th className="bg-base-200 font-semibold">字符</th>
                    <th className="bg-base-200 font-semibold">快捷键</th>
                    <th className="bg-base-200 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {shortcuts.map((shortcut, index) => (
                    <tr key={index} className="hover:bg-base-200/50 transition-colors">
                      <td className="max-w-[120px] truncate">{shortcut.name}</td>
                      <td>
                        <span className="font-mono">{shortcut.character}</span>
                      </td>
                      <td>
                        <span className="font-mono">{shortcut.keyboardShortcut || '无'}</span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button
                            className="btn btn-ghost btn-xs btn-square hover:btn-info"
                            onClick={() => handleEditShortcut(index)}
                            title="编辑"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-ghost btn-xs btn-square hover:btn-error"
                            onClick={() => handleDeleteShortcut(index)}
                            title="删除"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Character Modal */}
        <dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">{mode === 'add' ? '添加快速插入的字符' : '编辑快速插入的字符'}</h3>

            <div className="form-control">
              <label className="label">
                <span className="label-text">名称</span>
              </label>
              <input
                type="text"
                className="input input-sm input-bordered w-full"
                value={currentShortcut.name}
                onChange={(e) => setCurrentShortcut({...currentShortcut, name: e.target.value})}
                placeholder="给这个字符起个名字"
              />
            </div>

            <div className="tabs tabs-boxed my-4">
              <a
                className={`tab tab-sm ${inputMode === 'text' ? 'tab-active' : ''}`}
                onClick={() => setInputMode('text')}
              >
                文本字符
              </a>
              <a
                className={`tab tab-sm ${inputMode === 'latex' ? 'tab-active' : ''}`}
                onClick={() => setInputMode('latex')}
              >
                数学符号
              </a>
            </div>

            {inputMode === 'text' ? (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">输入字符</span>
                </label>
                <input
                  type="text"
                  className="input input-sm input-bordered w-full"
                  value={currentShortcut.character}
                  onChange={(e) => setCurrentShortcut({...currentShortcut, character: e.target.value, latex: ''})}
                  placeholder="输入要插入的字符"
                />
              </div>
            ) : (
              <div className="form-control">
                <div className="relative">
                  <div className="overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-base-100 pb-2">
                    <div className="tabs tabs-lifted inline-flex">
                      {Object.keys(LATEX_SYMBOLS).map(category => (
                        <a
                          key={category}
                          className={`tab tab-sm min-w-max ${selectedCategory === category ? 'tab-active' : ''}`}
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4 mt-4">
                  {LATEX_SYMBOLS[selectedCategory].map(({symbol, latex}) => (
                    <button
                      key={latex}
                      className={`btn btn-sm btn-outline ${currentShortcut.latex === latex ? 'btn-primary' : ''}`}
                      onClick={() => handleSymbolSelect(latex)}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>

                {latexPreview && (
                  <div className="mt-4">
                    <label className="label">
                      <span className="label-text">预览</span>
                    </label>
                    <div className="flex items-center justify-center gap-4 p-4 bg-base-200 rounded-lg">
                      <div className="text-lg font-mono">
                        {currentShortcut.latex}
                      </div>
                      <div className="text-2xl">→</div>
                      <div
                        className="overflow-x-auto text-center"
                        dangerouslySetInnerHTML={{ __html: latexPreview }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">快捷键</span>
              </label>
              <input
                type="text"
                className="input input-sm input-bordered w-full"
                value={currentShortcut.keyboardShortcut}
                onKeyDown={handleKeyDown}
                placeholder="点击此处按下快捷键组合"
                readOnly
              />
            </div>

            {inputMode === 'latex' && (
              <div className="form-control mt-4">
                <label className="label cursor-pointer">
                  <span className="label-text">使用 $ 包裹数学公式</span>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={currentShortcut.wrapWithDollar}
                    onChange={(e) => setCurrentShortcut({...currentShortcut, wrapWithDollar: e.target.checked})}
                  />
                </label>
              </div>
            )}

            <div className="modal-action">
              <button
                className="btn btn-sm btn-primary"
                onClick={handleSaveShortcut}
                disabled={!currentShortcut.name || (!currentShortcut.character && !currentShortcut.latex)}
              >
                {mode === 'add' ? '确定' : '保存'}
              </button>
              <button className="btn btn-sm" onClick={handleCloseModal}>取消</button>
            </div>
          </div>
        </dialog>
      </div>
    </div>
  );
};

export default CharacterInsertionSettings;
