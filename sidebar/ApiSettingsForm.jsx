import React, { useEffect, useState } from "react";
import { user_info, reset_fingerprint } from "../lib";
import CharacterInsertionSettings from "./CharacterInsertionSettings";
import OtherFunctionalSettings from "./OtherFunctionalSettings";

const ApiSettingsForm = ({
  host,
  handleHostChange,
  name,
  handleNameChange,
  serverType,
  setServerType,
  isSettingsLoading
}) => {
  const [expirationDate, setExpirationDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [kouziAccessKey, setKouziAccessKey] = useState("");
  const [kouziAppId, setKouziAppId] = useState("");
  const [kouziOcrWorkflowId, setKouziOcrWorkflowId] = useState("");
  const [kouziSolveWorkflowId, setKouziSolveWorkflowId] = useState("");
  const [kouziEquationAlignWorkflowId, setKouziEquationAlignWorkflowId] = useState("");
  const [kouziQuestionSplitWorkflowId, setKouziQuestionSplitWorkflowId] = useState("");
  const [kouziReviewWorkflowId, setKouziReviewWorkflowId] = useState("");
  const [apiAddressMode, setApiAddressMode] = useState("preset"); // "preset" or "custom"
  const [customApiAddress, setCustomApiAddress] = useState("");

  // 预设的API地址选项
  const presetApiAddresses = [
    { value: "https://bedu.pingfury.top", label: "官方服务器" },
    { value: "http://47.109.61.89:5911", label: "官方服务器(备用地址1)" },
    { value: "https://bedu-p.pingfury.top", label: "官方服务器-高质量AI模型" },
    { value: "http://47.109.61.89:5914", label: "官方服务器-高质量AI模型(备用地址1)" }
  ];

  // Load saved settings from Chrome storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await new Promise((resolve) => {
          chrome.storage.sync.get([
            'kouziAccessKey',
            'kouziAppId',
            'kouziOcrWorkflowId',
            'kouziSolveWorkflowId',
            'kouziEquationAlignWorkflowId',
            'kouziQuestionSplitWorkflowId',
            'kouziReviewWorkflowId'
          ], resolve);
        });
        
        console.log('Loading settings from storage:', result);
        
        if (result.kouziAccessKey) setKouziAccessKey(result.kouziAccessKey);
        if (result.kouziAppId) setKouziAppId(result.kouziAppId);
        if (result.kouziOcrWorkflowId) setKouziOcrWorkflowId(result.kouziOcrWorkflowId);
        if (result.kouziSolveWorkflowId) setKouziSolveWorkflowId(result.kouziSolveWorkflowId);
        if (result.kouziEquationAlignWorkflowId) setKouziEquationAlignWorkflowId(result.kouziEquationAlignWorkflowId);
        if (result.kouziQuestionSplitWorkflowId) setKouziQuestionSplitWorkflowId(result.kouziQuestionSplitWorkflowId);
        if (result.kouziReviewWorkflowId) setKouziReviewWorkflowId(result.kouziReviewWorkflowId);

        // 检查当前host是否是预设地址
        if (host) {
          const isPresetAddress = presetApiAddresses.some(preset => preset.value === host);
          if (isPresetAddress) {
            setApiAddressMode("preset");
          } else {
            setApiAddressMode("custom");
            setCustomApiAddress(host);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, [host]);

  // 处理API地址选择变化
  const handleApiAddressChange = (e) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === "custom") {
      setApiAddressMode("custom");
      handleHostChange({ target: { value: customApiAddress } });
    } else {
      setApiAddressMode("preset");
      handleHostChange({ target: { value: selectedValue } });
    }
  };

  // 处理自定义API地址输入
  const handleCustomApiAddressChange = (e) => {
    const value = e.target.value;
    setCustomApiAddress(value);
    handleHostChange({ target: { value } });
  };

  // Save settings to Chrome storage when they change
  useEffect(() => {
    chrome.storage.sync.set({
      kouziAccessKey,
      kouziAppId,
      kouziOcrWorkflowId,
      kouziSolveWorkflowId,
      kouziEquationAlignWorkflowId,
      kouziQuestionSplitWorkflowId,
      kouziReviewWorkflowId
    });
  }, [kouziAccessKey, kouziAppId, kouziOcrWorkflowId, kouziSolveWorkflowId, kouziEquationAlignWorkflowId, kouziQuestionSplitWorkflowId, kouziReviewWorkflowId]);

  const fetchUserInfo = async () => {
    if (serverType === "扣子") return;
    
    try {
      setIsLoading(true);
      const userInfo = await user_info(host, name);
      if (userInfo && userInfo.exp_time) {
        const expTime = new Date(userInfo.exp_time);
        const formattedDate = `${expTime.getFullYear()}-${(expTime.getMonth() + 1).toString().padStart(2, '0')}-${expTime.getDate().toString().padStart(2, '0')} ${expTime.getHours().toString().padStart(2, '0')}:${expTime.getMinutes().toString().padStart(2, '0')}:${expTime.getSeconds().toString().padStart(2, '0')}`;
        setExpirationDate(formattedDate);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFingerprint = async () => {
    if (serverType === "扣子") return;
    
    if (!host || !name) {
      setResetMessage("请先填写API地址和用户名");
      return;
    }

    try {
      setIsResetting(true);
      setResetMessage("");
      const result = await reset_fingerprint(host, name);
      if (result) {
        setResetMessage("浏览器指纹重置成功");
        // Refresh user info after reset
        fetchUserInfo();
      } else {
        setResetMessage("重置失败，请重试");
      }
    } catch (error) {
      console.error('Error resetting fingerprint:', error);
      setResetMessage("重置失败，请重试");
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    if (serverType !== "扣子" && host && name) {
      fetchUserInfo();
    } else {
      setExpirationDate("");
    }
  }, [host, name, serverType]);

  return (
    <div className="flex flex-col items-center">
      <div className="form-control w-full max-w-xs mt-2">
        <label className="label">
          <span className="label-text">服务器类型</span>
        </label>
        {isSettingsLoading ? (
          <div className="select select-bordered select-sm">
            <span className="loading loading-spinner loading-xs"></span>
          </div>
        ) : (
          <select 
            className="select select-bordered select-sm"
            value={serverType}
            onChange={(e) => setServerType(e.target.value)}
          >
            <option value="官方服务器">官方服务器</option>
            <option value="扣子">扣子</option>
          </select>
        )}
      </div>

      {serverType === "扣子" ? (
        <>
          <div className="form-control w-full max-w-xs mt-2">
            <label className="label">
              <span className="label-text">扣子访问密钥</span>
            </label>
            <input
              type="text"
              value={kouziAccessKey}
              onChange={(e) => setKouziAccessKey(e.target.value)}
              placeholder="输入扣子访问密钥"
              className="input input-bordered input-sm"
            />
          </div>
          <div className="form-control w-full max-w-xs mt-2">
            <label className="label">
              <span className="label-text">扣子 App ID</span>
            </label>
            <input
              type="text"
              value={kouziAppId}
              onChange={(e) => setKouziAppId(e.target.value)}
              placeholder="输入扣子 App ID"
              className="input input-bordered input-sm"
            />
          </div>
          <div className="form-control w-full max-w-xs mt-2">
            <label className="label">
              <span className="label-text">文字识别工作流 ID</span>
            </label>
            <input
              type="text"
              value={kouziOcrWorkflowId}
              onChange={(e) => setKouziOcrWorkflowId(e.target.value)}
              placeholder="输入文字识别工作流 ID"
              className="input input-bordered input-sm"
            />
          </div>
          <div className="form-control w-full max-w-xs mt-2">
            <label className="label">
              <span className="label-text">解题工作流 ID</span>
            </label>
            <input
              type="text"
              value={kouziSolveWorkflowId}
              onChange={(e) => setKouziSolveWorkflowId(e.target.value)}
              placeholder="输入解题工作流 ID"
              className="input input-bordered input-sm"
            />
          </div>
          <div className="form-control w-full max-w-xs mt-2">
            <label className="label">
              <span className="label-text">方程对齐工作流 ID</span>
            </label>
            <input
              type="text"
              value={kouziEquationAlignWorkflowId}
              onChange={(e) => setKouziEquationAlignWorkflowId(e.target.value)}
              placeholder="输入方程对齐工作流 ID"
              className="input input-bordered input-sm"
            />
          </div>
          <div className="form-control w-full max-w-xs mt-2">
            <label className="label">
              <span className="label-text">题目切割工作流 ID</span>
            </label>
            <input
              type="text"
              value={kouziQuestionSplitWorkflowId}
              onChange={(e) => setKouziQuestionSplitWorkflowId(e.target.value)}
              placeholder="输入题目切割工作流 ID"
              className="input input-bordered input-sm"
            />
          </div>
          <div className="form-control w-full max-w-xs mt-2">
            <label className="label">
              <span className="label-text">审核工作流 ID</span>
            </label>
            <input
              type="text"
              value={kouziReviewWorkflowId}
              onChange={(e) => setKouziReviewWorkflowId(e.target.value)}
              placeholder="输入审核工作流 ID"
              className="input input-bordered input-sm"
            />
          </div>
        </>
      ) : (
        <>
          <div className="form-control w-full max-w-xs mt-2">
            <label className="label">
              <span className="label-text">API 地址</span>
            </label>
            <select
              className="select select-bordered select-sm"
              value={apiAddressMode === "custom" ? "custom" : host}
              onChange={handleApiAddressChange}
            >
              {presetApiAddresses.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">自定义</option>
            </select>
          </div>
          {apiAddressMode === "custom" && (
            <div className="form-control w-full max-w-xs mt-2">
              <label className="label">
                <span className="label-text">自定义 API 地址</span>
              </label>
              <input
                type="text"
                value={customApiAddress}
                onChange={handleCustomApiAddressChange}
                placeholder="输入自定义 API 地址"
                className="input input-bordered input-sm"
              />
            </div>
          )}
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
              <div className="flex gap-2">
                <button
                  onClick={handleResetFingerprint}
                  className="btn btn-sm btn-ghost"
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <span className="loading loading-spinner loading-xs mr-1"></span>
                  ) : null}
                  重置指纹
                </button>
                <button
                  onClick={fetchUserInfo}
                  className="btn btn-sm btn-ghost"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-xs mr-1"></span>
                  ) : null}
                  刷新
                </button>
              </div>
            </label>
            <input
              type="text"
              value={expirationDate}
              readOnly
              placeholder={isLoading ? "加载中..." : "过期时间"}
              className={`input input-bordered input-sm ${isLoading ? "opacity-70" : ""}`}
            />
            {resetMessage && (
              <div className="text-sm mt-1 text-info">{resetMessage}</div>
            )}
          </div>
        </>
      )}

      <CharacterInsertionSettings />
      <OtherFunctionalSettings />
    </div>
  );
};

export default ApiSettingsForm;
