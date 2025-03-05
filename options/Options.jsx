import React, { useState, useEffect } from "react";

export default function Options() {
  // Features metadata for rendering
  const featureSettings = [
    {
      id: 'jieti',
      name: '解题功能',
      description: '启用解题功能, 生成解答和解析',
      category: 'features',
      defaultEnabled: true,
    },
    {
      id: 'ocr',
      name: '文字识别',
      description: '启用文字识别功能, 识别文字, 公式',
      category: 'features',
      defaultEnabled: true,
    },
    {
      id: 'clue-claiming',
      name: '线索认领',
      description: '启用线索自动认领功能',
      category: 'features',
      defaultEnabled: false,
    },
    {
      id: 'darkMode',
      name: '深色模式',
      description: '启用深色模式，减轻眼睛疲劳',
      category: 'ui',
      defaultEnabled: false,
    }
  ];

  // Generate default settings from feature settings
  const defaultSettings = featureSettings.reduce((settings, feature) => {
    settings[feature.id] = feature.defaultEnabled;
      return settings;
    }, {});

  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from Chrome storage on component mount
  useEffect(() => {
    // Check if running in a Chrome extension environment
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(defaultSettings, (items) => {
        setSettings(items);
        setIsLoading(false);
      });
    } else {
      // Fallback for development environment
      console.log('Chrome storage not available, using default settings');
      setIsLoading(false);
    }
  }, []);

  const handleToggle = (setting) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const saveSettings = () => {
    // Save to Chrome storage if available
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set(settings, () => {
        showToast('设置已保存');
      });
    } else {
      // Fallback for development environment
      console.log('Settings saved (localStorage fallback):', settings);
      localStorage.setItem('eduExpSettings', JSON.stringify(settings));
      showToast('设置已保存');
    }
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    showToast('已重置为默认设置');
  };

  const showToast = (message) => {
    const toast = document.getElementById("save-toast");
    const toastMessage = document.getElementById("toast-message");

    if (toast && toastMessage) {
      toastMessage.textContent = message;
      toast.classList.remove("hidden");
      setTimeout(() => {
        toast.classList.add("hidden");
      }, 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Group settings by category
  const featuresGroup = featureSettings.filter(item => item.category === 'features');
  const uiGroup = featureSettings.filter(item => item.category === 'ui');

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-2xl font-bold text-primary mb-6">Edu-Exp 设置</h1>

            <div className="divider">功能启用设置</div>

            <div className="grid gap-4">
              {featuresGroup.map((feature) => (
                <div className="form-control" key={feature.id}>
                  <label className="label cursor-pointer">
                    <span className="label-text text-lg">{feature.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="label-text text-sm opacity-70">
                        {settings[feature.id] ? '已启用' : '已禁用'}
                      </span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={settings[feature.id]}
                        onChange={() => handleToggle(feature.id)}
                      />
                    </div>
                  </label>
                  <p className="text-sm opacity-70 mt-1">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="divider">界面设置</div>

            {uiGroup.map((feature) => (
              <div className="form-control" key={feature.id}>
                <label className="label cursor-pointer">
                  <span className="label-text text-lg">{feature.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="label-text text-sm opacity-70">
                      {settings[feature.id] ? '已启用' : '已禁用'}
                    </span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={settings[feature.id]}
                      onChange={() => handleToggle(feature.id)}
                    />
                  </div>
                </label>
                <p className="text-sm opacity-70 mt-1">{feature.description}</p>
              </div>
            ))}

            <div className="card-actions justify-end mt-6">
              <button
                className="btn btn-outline btn-primary"
                onClick={resetToDefaults}
              >
                恢复默认
              </button>
              <button
                className="btn btn-primary"
                onClick={saveSettings}
              >
                保存设置
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="collapse collapse-arrow bg-base-100 shadow-lg">
            <input type="checkbox" />
            <div className="collapse-title text-xl font-medium">
              关于 Edu-Exp
            </div>
            <div className="collapse-content">
              <p>Edu-Exp 是一款教育实验工具，旨在帮助用户更高效地学习和实验。</p>
              <p className="mt-2">版本：1.0.0</p>
              <div className="mt-4">
                <a href="#" className="link link-primary">查看文档</a> |
                <a href="#" className="link link-primary ml-2">报告问题</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      <div id="save-toast" className="toast toast-top toast-end hidden">
        <div className="alert alert-success">
          <span id="toast-message">设置已保存</span>
        </div>
      </div>
    </div>
  );
}
