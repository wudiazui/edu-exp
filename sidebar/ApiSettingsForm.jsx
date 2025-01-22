import React, { useEffect, useState } from 'react';
import { user_info } from '../lib'; // 确保正确导入 user_info 函数

const ApiSettingsForm = ({ host, handleHostChange, name, handleNameChange }) => {
    const [expirationDate, setExpirationDate] = useState('');

  const fetchUserInfo = async () => {
    try {
      const userInfo = await user_info(host, name); // 假设 name 是用户名
      if (userInfo && userInfo.exp_time) {
        const expTime = new Date(userInfo.exp_time); // 将 ISO 8601 字符串转换为日期对象
        const formattedDate = `${expTime.getFullYear()}-${(expTime.getMonth() + 1).toString().padStart(2, '0')}-${expTime.getDate().toString().padStart(2, '0')} ${expTime.getHours().toString().padStart(2, '0')}:${expTime.getMinutes().toString().padStart(2, '0')}:${expTime.getSeconds().toString().padStart(2, '0')}`; // 格式化为 YYYY-MM-DD HH:mm:ss
        setExpirationDate(formattedDate); // 更新状态
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

    useEffect(() => {
        fetchUserInfo();
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
                  <button onClick={fetchUserInfo} className="btn btn-sm btn-ghost ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
<path d="M4.06189 13C4.02104 12.6724 4 12.3387 4 12C4 7.58172 7.58172 4 12 4C14.5006 4 16.7332 5.14727 18.2002 6.94416M19.9381 11C19.979 11.3276 20 11.6613 20 12C20 16.4183 16.4183 20 12 20C9.61061 20 7.46589 18.9525 6 17.2916M9 17H6V17.2916M18.2002 4V6.94416M18.2002 6.94416V6.99993L15.2002 7M6 20V17.2916" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </label>
          <input
                    type="text"
                    value={expirationDate}
                    readOnly
                    placeholder="过期时间"
                    className="input input-bordered input-sm"
                />
            </div>
        </div>
    );
};

export default ApiSettingsForm;
