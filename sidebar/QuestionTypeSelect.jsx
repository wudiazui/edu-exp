import React, { useEffect, useState } from 'react';
import { topic_type_list, discipline_list } from '../lib'; // 导入 topic_type_list 函数

// 扣子服务器的固定学科和题型映射
const KOUZI_SUBJECT_TYPES = {
  shuxue: {
    name: "数学",
    types: ["问答", "单选", "填空", "计算题", "简便计算", "解方程"]
  },
  yuwen: {
    name: "语文",
    types: ["问答", "单选", "填空"]
  },
  yingyu: {
    name: "英语",
    types: ["问答", "单选", "填空"]
  },
  wuli: {
    name: "物理",
    types: ["问答", "单选", "填空", "计算题"]
  },
  huaxue: {
    name: "化学",
    types: ["问答", "单选", "填空", "计算题"]
  }
};

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
        // 根据当前选择的学科设置对应的题型列表
        const types = KOUZI_SUBJECT_TYPES[subject]?.types || [];
        setSelectOptions(types);
        // 如果当前选择的题型不在新的题型列表中，设置为第一个题型
        if (!types.includes(selectedValue) && types.length > 0) {
          setSelectedValue(types[0]);
        }
      } else {
        // 其他情况下从服务器获取题型列表
        if (!host || !uname) return;
        const data = await topic_type_list(host, uname, subject);
        console.log(data);
        setSelectOptions(data || []);
      }
    };

    const fetchDisciplines = async () => {
      if (serverType === "扣子") {
        // 使用固定的学科列表
        const kouziDisciplines = Object.entries(KOUZI_SUBJECT_TYPES).map(([code, data]) => ({
          code,
          name: data.name
        }));
        setDisciplines(kouziDisciplines);
        if (!subject) {
          setSubject(kouziDisciplines[0].code);
        }
      } else {
        if (!host || !uname) return;
        const data = await discipline_list(host, uname);
        if (data && Array.isArray(data) && data.length > 0) {
          setDisciplines(data);
          if (!subject) {
            setSubject(data[0].code);
          }
        }
      }
    };

    fetchOptions();
    fetchDisciplines();
  }, [host, uname, serverType, subject, setSubject, selectedValue, setSelectedValue]);

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
