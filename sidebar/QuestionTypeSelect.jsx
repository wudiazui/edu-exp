import React, { useEffect, useState } from 'react';
import { topic_type_list, discipline_list } from '../lib'; // 导入 topic_type_list 函数

// 扣子服务器的固定学科和题型映射
const KOUZI_SUBJECT_TYPES = {
  wuli: {
    name: "物理",
    types: ["问答", "单选", "填空", "计算题", "实验题", "理论推导"]
  },
  shengwu: {
    name: "生物",
    types: ["问答", "单选", "填空", "实验题"]
  },
  yingyu: {
    name: "英语",
    types: ["问答", "单选", "填空", "阅读理解", "作文", "词汇", "语法", "听力"]
  },
  yuwen: {
    name: "语文",
    types: ["单选", "填空", "阅读理解", "作文", "默写", "词语解释", "文言文", "诗歌鉴赏", "词语搭配", "猜字谜", "字音字形", "文学常识", "句式转换", "对联", "标点符号"]
  },
  huaxue: {
    name: "化学",
    types: ["问答", "单选", "填空", "计算题", "实验题", "反应方程式"]
  },
  shuxue: {
    name: "数学",
    types: ["问答", "单选", "填空", "计算题", "解方程", "简便计算"]
  },
  lishi: {
    name: "历史",
    types: ["问答", "单选", "填空", "史料分析", "时间线整理", "历史比较"]
  },
  zhengzhi: {
    name: "政治",
    types: ["问答", "单选", "多选", "填空", "简答", "论述题"]
  },
  dili: {
    name: "地理",
    types: ["问答", "单选", "填空", "阅读理解", "案例分析", "地图题"]
  }
};

const QuestionTypeSelect = ({
  isImageQuestion,
  setIsImageQuestion,
  selectedValue = "", // 确保默认值不为null
  setSelectedValue,
  host,
  uname,
  subject,
  setSubject,
  serverType, // 新增 serverType 属性
  gradeLevel,    // 新增 gradeLevel prop
  setGradeLevel, // 新增 setGradeLevel prop
}) => {
  const [selectOptions, setSelectOptions] = useState([]);
  const [disciplines, setDisciplines] = useState([]);

  const gradeLevels = ['小学', '初中', '高中', '大学'];  // 定义支持的学时

  useEffect(() => {
    const fetchOptions = async () => {
      if (serverType === "扣子") {
        // 根据当前选择的学科设置对应的题型列表
        const types = KOUZI_SUBJECT_TYPES[subject]?.types || [];
        setSelectOptions(types);
        // 如果当前选择的题型不在新的题型列表中，设置为第一个题型
        if (!types.includes(selectedValue) && types.length > 0) {
          setSelectedValue(types[0]);
        } else if (types.length === 0 && selectedValue === null) {
          // 确保selectedValue不为null
          setSelectedValue("");
        }
      } else {
        // 其他情况下从服务器获取题型列表
        if (!host || !uname) return;
        const data = await topic_type_list(host, uname, subject);
        console.log(data);
        const options = data || [];
        setSelectOptions(options);
        // 确保selectedValue不为null
        if (options.length > 0 && !options.includes(selectedValue)) {
          setSelectedValue(options[0]);
        } else if (options.length === 0 && selectedValue === null) {
          setSelectedValue("");
        }
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
    <div className="flex w-full p-2 items-center justify-between">
      <div className="flex items-center space-x-2">
        <select 
          className="select select-sm select-bordered w-20"
          value={gradeLevel}
          onChange={(e) => setGradeLevel(e.target.value)}
        >
          {gradeLevels.map(level => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
        <select 
          className="select select-sm select-bordered w-20"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          {disciplines.map(discipline => (
            <option key={discipline.code} value={discipline.code}>
              {discipline.name}
            </option>
          ))}
        </select>
        <select 
          className="select select-sm select-bordered w-24"
          value={selectedValue || ""} 
          onChange={(e) => setSelectedValue(e.target.value)}
        >
          {selectOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <div className="tooltip tooltip-bottom" data-tip="切换图片题模式">
          <input type="checkbox"
            className="toggle toggle-sm"
            checked={isImageQuestion}
            onChange={(e) => setIsImageQuestion(e.target.checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default QuestionTypeSelect;
