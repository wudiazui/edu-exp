import React, { useEffect, useState } from "react";
import { user_info, reset_fingerprint } from "../lib";
import CharacterInsertionSettings from "./CharacterInsertionSettings";

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

  // Load saved settings from Chrome storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await new Promise((resolve) => {
          chrome.storage.sync.get([
            'kouziAccessKey',
            'kouziAppId',
            'kouziOcrWorkflowId',
            'kouziSolveWorkflowId'
          ], resolve);
        });
        
        console.log('Loading settings from storage:', result);
        
        if (result.kouziAccessKey) setKouziAccessKey(result.kouziAccessKey);
        if (result.kouziAppId) setKouziAppId(result.kouziAppId);
        if (result.kouziOcrWorkflowId) setKouziOcrWorkflowId(result.kouziOcrWorkflowId);
        if (result.kouziSolveWorkflowId) setKouziSolveWorkflowId(result.kouziSolveWorkflowId);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Save settings to Chrome storage when they change
  useEffect(() => {
    chrome.storage.sync.set({
      kouziAccessKey,
      kouziAppId,
      kouziOcrWorkflowId,
      kouziSolveWorkflowId
    });
  }, [kouziAccessKey, kouziAppId, kouziOcrWorkflowId, kouziSolveWorkflowId]);

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
        </>
      ) : (
        <>
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
    </div>
  );
};

export default ApiSettingsForm;
