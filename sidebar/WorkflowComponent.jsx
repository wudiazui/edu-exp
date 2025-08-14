import React, { useState, useEffect } from 'react';
import { ocr_text, run_llm_stream, topic_type_list, discipline_list } from '../lib.js';
import { removeEmptyLinesFromString } from '../text.js';
import ImageUploader from './ImageUploader.jsx';
import CopyButton from './CopyButton.jsx';

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

const WorkflowComponent = ({ host, uname, serverType }) => {
  const [subject, setSubject] = useState('shuxue');
  const [gradeLevel, setGradeLevel] = useState('小学');
  const [selectedValue, setSelectedValue] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState('');
  const [answer, setAnswer] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [currentStep, setCurrentStep] = useState('ready'); // ready, ocr, solving, completed
  const [site, setSite] = useState('bd');
  const [selectOptions, setSelectOptions] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [autoWorkflow, setAutoWorkflow] = useState(true); // 自动工作流开关

  const gradeLevels = ['小学', '初中', '高中', '大学'];

  // 从存储中加载site设置
  useEffect(() => {
    chrome.storage.sync.get(['site'], (result) => {
      if (result.site) {
        setSite(result.site);
      }
    });
  }, []);

  // Load autoWorkflow from storage
  useEffect(() => {
    chrome.storage.sync.get(['autoWorkflow'], (result) => {
      setAutoWorkflow(result.autoWorkflow ?? true);
    });

    // 监听存储变更
    const handleStorageChange = (changes, namespace) => {
      if (namespace === 'sync' && 'autoWorkflow' in changes) {
        setAutoWorkflow(changes.autoWorkflow.newValue ?? true);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // 获取学科和题型数据
  useEffect(() => {
    const fetchOptions = async () => {
      if (serverType === "扣子") {
        // 根据当前选择的学科设置对应的题型列表
        const types = KOUZI_SUBJECT_TYPES[subject]?.types || [];
        setSelectOptions(types);
        // 如果当前选择的题型不在新的题型列表中，设置为第一个题型
        if (!types.includes(selectedValue) && types.length > 0) {
          setSelectedValue(types[0]);
        } else if (types.length === 0 && !selectedValue) {
          setSelectedValue("");
        }
      } else {
        // 其他情况下从服务器获取题型列表
        if (!host || !uname) return;
        const data = await topic_type_list(host, uname, subject);
        const options = data || [];
        setSelectOptions(options);
        // 确保selectedValue有值
        if (options.length > 0 && !options.includes(selectedValue)) {
          setSelectedValue(options[0]);
        } else if (options.length === 0 && !selectedValue) {
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
  }, [host, uname, serverType, subject, selectedValue]);

  const handleStartSolving = async () => {
    if (!selectedImage) {
      alert('请先选择或粘贴一张图片');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('ocr');
    setOcrResult('');
    setAnswer('');
    setAnalysis('');

    try {
      // 第一步：文字识别
      console.log('开始文字识别...');
      const recognizedText = await ocr_text({ 
        'image_data': selectedImage,
        'orc_type': ''
      }, host, uname);

      if (!recognizedText) {
        throw new Error('文字识别失败');
      }

      setOcrResult(recognizedText);
      setCurrentStep('solving');

      // 第二步：生成解答
      console.log('开始生成解答...');
      setAnswer('');
      
      await new Promise((resolve, reject) => {
        run_llm_stream(
          host,
          uname,
          'topic_answer',
          {
            'topic': recognizedText,
            'discipline': subject,
            'image_data': selectedImage,
            'topic_type': selectedValue,
            'school_level': gradeLevel,
            'site': site
          },
          // 数据块处理函数
          (chunk) => {
            try {
              if (chunk.trim() === '[DONE]') {
                return;
              }

              const data = JSON.parse(chunk);
              if (data.type === 'content') {
                setAnswer(prev => prev + (data.text || ''));
              } else {
                const text = data.text || data.topic || data.content || '';
                if (text) {
                  setAnswer(prev => prev + text);
                }
              }
            } catch (e) {
              if (chunk.trim() !== '[DONE]') {
                console.log('Chunk is not JSON format:', chunk);
              }
            }
          },
          // 错误处理函数
          (error) => {
            console.error('解答生成出错:', error);
            reject(error);
          },
          // 完成处理函数
          () => {
            setAnswer(prev => {
              const finalAnswer = site === 'bc' ? prev : removeEmptyLinesFromString(prev, gradeLevel === "小学");
              
              // 检查是否启用自动工作流
              if (autoWorkflow) {
                // 在完成生成解答后，自动填入解答并继续生成解析
                setTimeout(() => {
                  if (finalAnswer.trim()) {
                    // 自动填入解答
                    chrome.runtime.sendMessage({
                      type: "answer",
                      text: finalAnswer
                    });
                  }
                }, 100);
              }
              
              // 解答完成后，开始生成解析
              setTimeout(() => {
                generateAnalysis(recognizedText, finalAnswer);
              }, 500);
              
              return finalAnswer;
            });
            resolve();
          }
        );
      });

    } catch (error) {
      console.error('工作流执行出错:', error);
      alert('执行失败: ' + (error.message || '未知错误'));
      setIsProcessing(false);
      setCurrentStep('ready');
    }
  };

  const generateAnalysis = async (question, answerText) => {
    try {
      console.log('开始生成解析...');
      setAnalysis('');

      await new Promise((resolve, reject) => {
        run_llm_stream(
          host,
          uname,
          'topic_analysis',
          {
            'topic': question,
            'answer': answerText,
            'analysis': '',
            'discipline': subject,
            'image_data': selectedImage,
            'topic_type': selectedValue,
            'school_level': gradeLevel,
            'site': site
          },
          // 数据块处理函数
          (chunk) => {
            try {
              if (chunk.trim() === '[DONE]') {
                return;
              }

              const data = JSON.parse(chunk);
              if (data.type === 'content') {
                setAnalysis(prev => prev + (data.text || ''));
              } else {
                const text = data.text || data.topic || data.content || '';
                if (text) {
                  setAnalysis(prev => prev + text);
                }
              }
            } catch (e) {
              if (chunk.trim() !== '[DONE]') {
                console.log('Chunk is not JSON format:', chunk);
              }
            }
          },
          // 错误处理函数
          (error) => {
            console.error('解析生成出错:', error);
            reject(error);
          },
          // 完成处理函数
          () => {
            setAnalysis(prev => {
              const finalAnalysis = site === 'bc' ? prev : removeEmptyLinesFromString(prev, gradeLevel === "小学");
              setCurrentStep('completed');
              setIsProcessing(false);
              
              // 检查是否启用自动工作流
              if (autoWorkflow) {
                // 在完成生成解析后，自动填入解析
                setTimeout(() => {
                  if (finalAnalysis.trim()) {
                    // 自动填入解析
                    chrome.runtime.sendMessage({
                      type: "analysis",
                      text: finalAnalysis
                    });
                  }
                }, 100);
              }
              
              return finalAnalysis;
            });
            resolve();
          }
        );
      });

    } catch (error) {
      console.error('解析生成出错:', error);
      setIsProcessing(false);
      setCurrentStep('completed');
    }
  };

  const handleReset = () => {
    setCurrentStep('ready');
    setOcrResult('');
    setAnswer('');
    setAnalysis('');
    setSelectedImage(null);
  };

  return (
    <div className="container max-auto w-full">
      <div className="flex flex-col gap-3">
        {/* 学段、学科、题型选择 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="form-control">
            <select 
              className="select select-bordered select-sm"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              disabled={isProcessing}
            >
              {gradeLevels.map(level => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <select 
              className="select select-bordered select-sm"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isProcessing}
            >
              {disciplines.map(discipline => (
                <option key={discipline.code} value={discipline.code}>
                  {discipline.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <select 
              className="select select-bordered select-sm"
              value={selectedValue || ""}
              onChange={(e) => setSelectedValue(e.target.value)}
              disabled={isProcessing}
            >
              {selectOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 图片粘贴组件 */}
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-xs">题目图片</span>
          </label>
          <ImageUploader
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            placeholder="点击选择图片或直接粘贴图片"
            showDeleteButton={true}
            maxPreviewWidth={300}
            maxPreviewHeight={200}
            disabled={isProcessing}
          />
        </div>

        {/* 开始解题按钮 */}
        <button
          onClick={handleStartSolving}
          disabled={!selectedImage || isProcessing}
          className={`btn btn-primary btn-sm w-full ${isProcessing ? 'opacity-90' : ''}`}
        >
          {isProcessing ? (
            <>
              <span className="loading loading-spinner loading-xs mr-2"></span>
              <span>
                {currentStep === 'ocr' && '文字识别中...'}
                {currentStep === 'solving' && '解题中...'}
              </span>
            </>
          ) : (
            "开始解题"
          )}
        </button>

        {/* 结果显示区域 */}
        {currentStep !== 'ready' && (
          <div className="space-y-3 mt-4">
            {/* 文字识别结果 */}
            {ocrResult && (
              <div className="form-control">
                <div className="label flex justify-between items-center py-1">
                  <span className="label-text text-sm font-medium">识别结果</span>
                  <div className="flex gap-1 items-center">
                    <button
                      onClick={() => {
                        chrome.runtime.sendMessage({
                          type: "topic",
                          text: ocrResult
                        });
                      }}
                      className="btn btn-xs btn-outline"
                    >
                      填入
                    </button>
                    <button
                      className="btn btn-xs btn-ghost"
                      onClick={() => {
                        if (ocrResult) {
                          navigator.clipboard.writeText(ocrResult)
                            .then(() => {
                              console.log('Copied to clipboard');
                            })
                            .catch(err => {
                              console.error('Failed to copy:', err);
                            });
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                      </svg>
                    </button>
                  </div>
                </div>
                <textarea
                  value={ocrResult}
                  readOnly
                  className="textarea textarea-bordered text-sm h-20"
                  placeholder="文字识别结果..."
                />
              </div>
            )}

            {/* 解答结果 */}
            {answer && (
              <div className="form-control">
                <div className="label flex justify-between items-center py-1">
                  <span className="label-text text-sm font-medium">解答</span>
                  <div className="flex gap-1 items-center">
                    <button
                      onClick={() => {
                        chrome.runtime.sendMessage({
                          type: "answer",
                          text: answer
                        });
                      }}
                      className="btn btn-xs btn-outline"
                    >
                      填入
                    </button>
                    <button
                      className="btn btn-xs btn-ghost"
                      onClick={() => {
                        if (answer) {
                          navigator.clipboard.writeText(answer)
                            .then(() => {
                              console.log('Copied to clipboard');
                            })
                            .catch(err => {
                              console.error('Failed to copy:', err);
                            });
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                      </svg>
                    </button>
                  </div>
                </div>
                <textarea
                  value={answer}
                  readOnly
                  className="textarea textarea-bordered text-sm min-h-32"
                  placeholder="解答结果..."
                />
              </div>
            )}

            {/* 解析结果 */}
            {analysis && (
              <div className="form-control">
                <div className="label flex justify-between items-center py-1">
                  <span className="label-text text-sm font-medium">解析</span>
                  <div className="flex gap-1 items-center">
                    <button
                      onClick={() => {
                        chrome.runtime.sendMessage({
                          type: "analysis",
                          text: analysis
                        });
                      }}
                      className="btn btn-xs btn-outline"
                    >
                      填入
                    </button>
                    <button
                      className="btn btn-xs btn-ghost"
                      onClick={() => {
                        if (analysis) {
                          navigator.clipboard.writeText(analysis)
                            .then(() => {
                              console.log('Copied to clipboard');
                            })
                            .catch(err => {
                              console.error('Failed to copy:', err);
                            });
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                      </svg>
                    </button>
                  </div>
                </div>
                <textarea
                  value={analysis}
                  readOnly
                  className="textarea textarea-bordered text-sm min-h-32"
                  placeholder="解析结果..."
                />
              </div>
            )}

            {/* 重置按钮 */}
            {currentStep === 'completed' && (
              <button
                onClick={handleReset}
                className="btn btn-outline btn-sm w-full rounded-xl"
              >
                重新开始
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowComponent;