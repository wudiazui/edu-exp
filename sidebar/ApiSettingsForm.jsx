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
    </div>
  );
};

export default ApiSettingsForm;
