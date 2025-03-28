import React, { useEffect, useState } from 'react';
import { topic_type_list, discipline_list } from '../lib'; // 导入 topic_type_list 函数

const QuestionTypeSelect = ({
  isImageQuestion,
  setIsImageQuestion,
  selectedValue,
  setSelectedValue,
  host,
  uname,
  subject,
  setSubject,
  serverType, // 新增 serverType 属性
}) => {
  const [selectOptions, setSelectOptions] = useState([]);
  const [disciplines, setDisciplines] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      if (serverType === "扣子") {
        // 当服务器类型为"扣子"时，使用固定的题型列表
        setSelectOptions(["问答", "单选", "填空", "计算题", "简便计算", "解方程"]);
      } else {
        // 其他情况下从服务器获取题型列表
        if (!host || !uname) return;
        const data = await topic_type_list(host, uname);
        console.log(data);
        setSelectOptions(data || []);
      }
    };

    const fetchDisciplines = async () => {
      if (!host || !uname) return;
      const data = await discipline_list(host, uname);
      if (data && Array.isArray(data) && data.length > 0) {
        setDisciplines(data);
        if (!subject) {
          setSubject(data[0].code);
        }
      }
    };

    fetchOptions();
    fetchDisciplines();
  }, [host, uname, serverType, subject, setSubject]); // 添加 serverType 到依赖项

  return (
    <div className="flex w-full p-2">
      <div className="flex items-center mr-2">
        <select 
          className="select select-sm select-bordered"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          {disciplines.map(discipline => (
            <option key={discipline.code} value={discipline.code}>
              {discipline.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center w-full">
        <span className="label-text flex-shrink-0 mx-1">题型</span>
        <select className="select select-sm select-bordered flex-grow" value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)}>
          {selectOptions.map(option => (
            <option key={option} value={option}>{option}</option>
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
    </div>
  );
};

export default QuestionTypeSelect;
