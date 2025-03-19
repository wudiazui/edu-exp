import React, { useEffect, useState } from "react";
import { user_info, reset_fingerprint } from "../lib";
import CharacterInsertionSettings from "./CharacterInsertionSettings";

const ApiSettingsForm = ({
  host,
  handleHostChange,
  name,
  handleNameChange,
}) => {
  const [expirationDate, setExpirationDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const fetchUserInfo = async () => {
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
    if (host && name) {
      fetchUserInfo();
    } else {
      setExpirationDate("");
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

      <CharacterInsertionSettings />
    </div>
  );
};

export default ApiSettingsForm;
