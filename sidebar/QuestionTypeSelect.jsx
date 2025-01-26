import React, { useEffect, useState } from 'react';
import { topic_type_list } from '../lib'; // 导入 topic_type_list 函数

const QuestionTypeSelect = ({
  isImageQuestion,
  setIsImageQuestion,
  selectedValue,
  setSelectedValue,
  host,
  uname,
  isSwapActive,
  setIsSwapActive,
}) => {
  const [selectOptions, setSelectOptions] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      // 检查 host 和 uname 是否为空
      if (!host || !uname) return; // 如果任意一个为空，直接返回
      const data = await topic_type_list(host, uname);
      console.log(data);
      setSelectOptions(data || []); // 确保 setSelectOptions 传入一个数组
    };
    fetchOptions();
  }, [host, uname]); // 依赖项更新

  return (
    <div className="flex w-full p-2">
      <div className="flex items-center w-full">
        <span className="label-text flex-shrink-0 mx-1">题型</span>
        <select className="select select-sm select-bordered flex-grow" value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)}>
          {selectOptions.map(option => (
            <option key={option} value={option}>{option}</option> // 使用从父组件传递的选项
          ))}
        </select>
      </div>
      <div className="form-control w-3/6 flex items-center">
        <label className="label cursor-pointer">
          <span className="label-text mr-1">图片题</span>
          <input type="checkbox"
            className="checkbox"
            checked={isImageQuestion}
            onChange={(e) => setIsImageQuestion(e.target.checked)}
          />
        </label>
      </div>
      <div className="w-1/6 flex items-center">
        <label className="swap">
          <input type="checkbox"
            checked={isSwapActive}
            onChange={(e) => setIsSwapActive(e.target.checked)}
          />
          <div className="swap-on">语文</div>
          <div className="swap-off">数学</div>
        </label>
      </div>
    </div>
  );
};

export default QuestionTypeSelect;
