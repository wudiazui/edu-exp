import React, { useEffect, useState } from "react";
import { user_info } from "../lib"; // 确保正确导入 user_info 函数

const ApiSettingsForm = ({
  host,
  handleHostChange,
  name,
  handleNameChange,
}) => {
  const [expirationDate, setExpirationDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState([]);
  const [currentShortcut, setCurrentShortcut] = useState({ name: '', character: '', keyboardShortcut: '' });
  const [editingIndex, setEditingIndex] = useState(-1);
  const [mode, setMode] = useState('add'); // 'add' or 'edit'

  useEffect(() => {
    // Load shortcuts from Chrome storage when component mounts
    chrome.storage.sync.get(['shortcuts'], (result) => {
      if (result.shortcuts) {
        setShortcuts(result.shortcuts);
      }
    });
  }, []);

  const handleKeyDown = (e, isEditing = false, index = -1) => {
    e.preventDefault();
    const keys = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');
    if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt') {
      keys.push(e.key.toUpperCase());
    }
    const shortcutStr = keys.join('+');

    if (isEditing) {
      setCurrentShortcut(prev => ({ ...prev, keyboardShortcut: shortcutStr }));
    } else {
      setCurrentShortcut(prev => ({ ...prev, keyboardShortcut: shortcutStr }));
    }
  };

  const handleSaveShortcut = () => {
    if (!currentShortcut.name || !currentShortcut.character) return;

    let updatedShortcuts;
    if (mode === 'add') {
      updatedShortcuts = [...shortcuts, currentShortcut];
    } else {
      updatedShortcuts = shortcuts.map((shortcut, i) => {
        if (i === editingIndex) {
          return currentShortcut;
        }
        return shortcut;
      });
    }

    setShortcuts(updatedShortcuts);
    chrome.storage.sync.set({ shortcuts: updatedShortcuts });
    // 发送消息到 background script
    chrome.runtime.sendMessage({
      type: 'UPDATE_SHORTCUTS',
      shortcuts: updatedShortcuts
    });
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentShortcut({ name: '', character: '', keyboardShortcut: '' });
    setEditingIndex(-1);
  };

  const handleDeleteShortcut = (index) => {
    const updatedShortcuts = shortcuts.filter((_, i) => i !== index);
    setShortcuts(updatedShortcuts);
    chrome.storage.sync.set({ shortcuts: updatedShortcuts });
    // 发送消息到 background script
    chrome.runtime.sendMessage({
      type: 'UPDATE_SHORTCUTS',
      shortcuts: updatedShortcuts
    });
  };

  const handleEditShortcut = (index) => {
    setMode('edit');
    setEditingIndex(index);
    setCurrentShortcut({...shortcuts[index]});
    setIsModalOpen(true);
  };

  const handleAddNewShortcut = () => {
    setMode('add');
    setEditingIndex(-1);
    setCurrentShortcut({ name: '', character: '', keyboardShortcut: '' });
    setIsModalOpen(true);
  };

  const fetchUserInfo = async () => {
    try {
      setIsLoading(true);
      const userInfo = await user_info(host, name); // 假设 name 是用户名
      if (userInfo && userInfo.exp_time) {
        const expTime = new Date(userInfo.exp_time); // 将 ISO 8601 字符串转换为日期对象
        const formattedDate = `${expTime.getFullYear()}-${(expTime.getMonth() + 1).toString().padStart(2, '0')}-${expTime.getDate().toString().padStart(2, '0')} ${expTime.getHours().toString().padStart(2, '0')}:${expTime.getMinutes().toString().padStart(2, '0')}:${expTime.getSeconds().toString().padStart(2, '0')}`; // 格式化为 YYYY-MM-DD HH:mm:ss
        setExpirationDate(formattedDate); // 更新状态
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    if (host && name) {
      fetchUserInfo();
    } else {
      setExpirationDate(""); // Clear expiration date if host or name is empty
    }
  }, [host, name]);

  return (
    <div className="flex flex-col items-center">
      <div className="form-control w-full max-w-xs mt-2">
        <label className="label">
          <span className="label-text">API 地址</span>
        </label>
        <input
          type="text"
          value={host}
          onChange={handleHostChange}
          placeholder="输入 API 地址"
          className="input input-bordered input-sm"
        />
      </div>
      <div className="form-control w-full max-w-xs mt-2">
        <label className="label">
          <span className="label-text">用户名</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="输入用户名"
          className="input input-bordered input-sm"
        />
      </div>
      <div className="form-control w-full max-w-xs mt-2">
        <label className="label flex justify-between items-center">
          <span className="label-text">过期时间</span>
           <button
                onClick={fetchUserInfo}
                className="btn btn-sm btn-ghost ml-2"
             disabled={isLoading}
           >
             {isLoading ? (
               <span className="loading loading-spinner loading-xs mr-1"></span>
             ) : null}
             刷新
             </button>
           </label>
        <input
          type="text"
          value={expirationDate}
          readOnly
          placeholder={isLoading ? "加载中..." : "过期时间"}
          className={`input input-bordered input-sm ${isLoading ? "opacity-70" : ""}`}
        />
      </div>

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

                    {/* Shortcuts Table */}
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
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                          className="btn btn-ghost btn-xs btn-square hover:btn-error"
                                                            onClick={() => handleDeleteShortcut(index)}
                                                            title="删除"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
                </div>
            </div>

            {/* Character Modal */}
            <dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
                <div className="modal-box">
                    <h3 className="font-bold text-lg">{mode === 'add' ? '添加快速插入的字符' : '编辑快速插入的字符'}</h3>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">名称</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered input-sm w-full max-w-xs"
                            value={currentShortcut.name}
                            onChange={(e) => setCurrentShortcut({...currentShortcut, name: e.target.value})}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">字符</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered input-sm w-full max-w-xs"
                            value={currentShortcut.character}
                            onChange={(e) => setCurrentShortcut({...currentShortcut, character: e.target.value})}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">快捷键</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered input-sm w-full max-w-xs"
                            value={currentShortcut.keyboardShortcut}
                            onKeyDown={handleKeyDown}
                            placeholder="点击此处按下快捷键组合"
                            readOnly
                        />
                    </div>
                    <div className="modal-action">
                        <button className="btn btn-primary" onClick={handleSaveShortcut}>{mode === 'add' ? '确定' : '保存'}</button>
                        <button className="btn" onClick={handleCloseModal}>取消</button>
                    </div>
                </div>
            </dialog>
    </div>
  );
};

export default ApiSettingsForm;
