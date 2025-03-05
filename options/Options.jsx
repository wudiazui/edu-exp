import React, { useState, useEffect, useRef } from "react";

export default function Options() {
  // Features metadata for rendering
  const featureSettings = [
    {
      id: "jieti",
      name: "解题功能",
      description: "启用解题功能, 生成解答和解析",
      category: "features",
      defaultEnabled: true,
    },
    {
      id: "ocr",
      name: "文字识别",
      description: "启用文字识别功能, 识别文字, 公式",
      category: "features",
      defaultEnabled: true,
    },
    {
      id: "clue-claiming",
      name: "线索认领",
      description: "启用线索自动认领功能",
      category: "features",
      defaultEnabled: false,
    },
    {
      id: "darkMode",
      name: "深色模式",
      description: "启用深色模式，减轻眼睛疲劳",
      category: "ui",
      defaultEnabled: false,
    },
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
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(defaultSettings, (items) => {
        setSettings(items);
        setIsLoading(false);
      });
    } else {
      // Fallback for development environment
      console.log("Chrome storage not available, using default settings");
      setIsLoading(false);
    }
  }, []);

  const handleToggle = (setting) => {
    const newSettings = {
      ...settings,
      [setting]: !settings[setting],
    };

    setSettings(newSettings);
    
    // Find feature name for better toast message
    const featureName =
      featureSettings.find((f) => f.id === setting)?.name || setting;

    // Auto-save when toggling - save individual setting for better compatibility
    if (typeof chrome !== "undefined" && chrome.storage) {
      // Create an object with just the changed setting
      const saveObject = { [setting]: newSettings[setting] };
      
      chrome.storage.sync.set(saveObject, () => {
        showToast(`${featureName}设置已更新`);
      });
    } else {
      // Fallback for development environment
      console.log("Settings auto-saved (localStorage fallback):", newSettings);
      localStorage.setItem("eduExpSettings", JSON.stringify(newSettings));
      showToast(`${featureName}设置已更新`);
    }
  };

  const saveSettings = () => {
    // Auto-save settings
    if (typeof chrome !== "undefined" && chrome.storage) {
      // Save each setting individually to ensure they trigger proper change events
      const savePromises = Object.entries(settings).map(([key, value]) => {
        return new Promise((resolve) => {
          chrome.storage.sync.set({ [key]: value }, resolve);
        });
      });
      
      Promise.all(savePromises).then(() => {
        showToast(`设置已全部更新`);
      });
    } else {
      // Fallback for development environment
      console.log("Settings auto-saved (localStorage fallback):", settings);
      localStorage.setItem("eduExpSettings", JSON.stringify(settings));
      showToast(`设置已全部更新`);
    }
  };

  const resetToDefaults = () => {
    // Update state with default settings
    setSettings(defaultSettings);
    
    // Save default settings to storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      // Save each setting individually to ensure they trigger proper change events
      const savePromises = Object.entries(defaultSettings).map(([key, value]) => {
        return new Promise((resolve) => {
          chrome.storage.sync.set({ [key]: value }, resolve);
        });
      });
      
      Promise.all(savePromises).then(() => {
        showToast('已重置为默认设置');
      });
    } else {
      // Fallback for development environment
      console.log('Default settings saved (localStorage fallback):', defaultSettings);
      localStorage.setItem('eduExpSettings', JSON.stringify(defaultSettings));
      showToast('已重置为默认设置');
    }
  };

  // Toast notification state and timeout reference
  const [toastMessage, setToastMessage] = useState("");
  const [showToastNotification, setShowToastNotification] = useState(false);
  const toastTimeoutRef = React.useRef(null);

  const showToast = (message) => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToastMessage(message);
    setShowToastNotification(true);

    // Hide toast after 2 seconds
    toastTimeoutRef.current = setTimeout(() => {
      setShowToastNotification(false);
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Group settings by category
  const featuresGroup = featureSettings.filter(
    (item) => item.category === "features",
  );
  const uiGroup = featureSettings.filter((item) => item.category === "ui");

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-2xl font-bold text-primary mb-6">
              Edu-Exp 设置
            </h1>

            <div className="divider">功能启用设置</div>

            <div className="grid gap-4">
              {featuresGroup.map((feature) => (
                <div className="form-control" key={feature.id}>
                  <label className="label cursor-pointer">
                    <span className="label-text text-lg">{feature.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="label-text text-sm opacity-70">
                        {settings[feature.id] ? "已启用" : "已禁用"}
                      </span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={settings[feature.id]}
                        onChange={() => handleToggle(feature.id)}
                      />
                    </div>
                  </label>
                  <p className="text-sm opacity-70 mt-1">
                    {feature.description}
                  </p>
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
                      {settings[feature.id] ? "已启用" : "已禁用"}
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

            <div className="card-actions justify-between items-center mt-6">
              <div className="text-sm opacity-70">
                <span className="badge badge-success badge-sm mr-2">自动</span>
                设置会自动保存
              </div>
              <div>
                <button
                  className="btn btn-outline btn-primary mr-2"
                  onClick={resetToDefaults}
                >
                  恢复默认
                </button>
                <button className="btn btn-primary" onClick={saveSettings}>
                  全部保存
                </button>
              </div>
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
              <p>
                Edu-Exp 是一款教育实验工具，旨在帮助用户更高效地学习和实验。
              </p>
              <p className="mt-2">版本：1.0.0</p>
              <div className="mt-4">
                <a href="#" className="link link-primary">
                  查看文档
                </a>{" "}
                |
                <a href="#" className="link link-primary ml-2">
                  报告问题
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {showToastNotification && (
        <div className="toast toast-top toast-end">
          <div className="alert alert-success">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
