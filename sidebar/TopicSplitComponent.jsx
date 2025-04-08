import React from 'react';
import CopyButton from './CopyButton.jsx';
import { CozeService } from '../coze.js';
import { topic_split } from '../lib.js';

const TopicSplitComponent = ({ host, uname, serverType }) => {
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [splitResult, setSplitResult] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [cozeService, setCozeService] = React.useState(null);

  // Initialize CozeService when serverType is "扣子"
  React.useEffect(() => {
    if (serverType === "扣子") {
      chrome.storage.sync.get(['kouziAccessKey', 'kouziTopicSplitWorkflowId'], (result) => {
        if (result.kouziAccessKey && result.kouziTopicSplitWorkflowId) {
          setCozeService(new CozeService(result.kouziAccessKey));
        }
      });
    }
  }, [serverType]);



  const onPaste = (event) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImage(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSplitTopic = async () => {
    if (selectedImage) {
      setIsLoading(true);
      try {
        if (serverType === "扣子" && cozeService) {
          // Convert base64 to blob
          const base64Data = selectedImage.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
            const slice = byteCharacters.slice(offset, offset + 1024);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          const blob = new Blob(byteArrays, { type: 'image/jpeg' });
          const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

          // Get workflow ID from storage
          const result = await new Promise((resolve) => {
            chrome.storage.sync.get(['kouziTopicSplitWorkflowId', 'kouziAppId'], resolve);
          });

          // Upload file and execute workflow
          const uploadResult = await cozeService.uploadFile(file);
          console.log(uploadResult);

          const workflowResult = await cozeService.executeWorkflow(result.kouziTopicSplitWorkflowId, {
            app_id: result.kouziAppId,
            parameters: {
              img: {
                type: "image",
                file_id: uploadResult.id
              }
            }
          });

          // Handle the workflow result
          if (workflowResult && workflowResult.data) {
            try {
              const parsedData = typeof workflowResult.data === 'string' 
                ? JSON.parse(workflowResult.data) 
                : workflowResult.data;
              
              if (parsedData) {
                // 确保响应格式符合要求，包含 text 和 list 字段
                const formattedResult = JSON.stringify({
                  text: parsedData.text || '',
                  list: parsedData.list || []
                }, null, 2);
                setSplitResult(formattedResult);
              } else {
                setSplitResult('切割失败：未获取到切割结果');
              }
            } catch (error) {
              console.error('Error parsing workflow result:', error);
              setSplitResult('切割失败：数据解析错误');
            }
          } else {
            setSplitResult('切割失败：未获取到切割结果');
          }
        } else {
          // 直接使用 topic_split 函数处理图片切割
          try {
            const result = await topic_split({ 'image_data': selectedImage }, host, uname);
            
            if (result) {
              // 处理新的响应格式，包含 text 和 list 字段
              // 将结果转换为 JSON 字符串以便在文本区域中显示
              const formattedResult = JSON.stringify({
                text: result.text || '',
                list: result.list || []
              }, null, 2);
              setSplitResult(formattedResult);
            } else {
              setSplitResult('切割失败：未获取到切割结果');
            }
          } catch (error) {
            console.error('Error in topic split:', error);
            setSplitResult('切割失败：' + (error.message || '未知错误'));
          }
        }
      } catch (error) {
        console.error('Error in topic split:', error);
        setSplitResult('切割失败：' + (error.message || '未知错误'));
      } finally {
        setIsLoading(false);
      }
    }
  };



  return (
    <div className="container max-auto w-full">
      <div className="mt-4 w-full">
        <input type="text" onPaste={onPaste} placeholder="粘贴图片" className="input input-bordered w-full" />
      </div>
      <div className="mt-2 w-full p-2 rounded-lg border">
        {selectedImage ? (
          <img src={selectedImage} alt="Selected" className="img object-cover" />
        ) : (
          <div className="skeleton w-full h-48"></div>
        )}
      </div>
      <div className="mt-2">
        <button className="btn btn-wide w-full" onClick={handleSplitTopic} disabled={isLoading}>
          {isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            "切割题目"
          )}
        </button>
      </div>
      <div className="mt-2">
        <div className="label">
          <span className="label-text">题目列表</span>
        </div>
        <div className="space-y-3">
          {(() => {
            try {
              const parsed = JSON.parse(splitResult);
              if (parsed.list && Array.isArray(parsed.list) && parsed.list.length > 0) {
                return parsed.list.map((item, index) => (
                  <div key={index} className="border rounded-lg p-2">
                    <div className="font-medium mb-1 flex justify-between items-center">
                      <span>题目 {index + 1}</span>
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => {
                            try {
                              // 发送当前题目项到浏览器
                              chrome.runtime.sendMessage({
                                type: "topic",
                                text: {
                                  text: item,
                                  list: []
                                }
                              });
                            } catch (error) {
                              console.error('Error sending list item:', error);
                            }
                          }}
                          className="btn btn-ghost btn-xs flex items-center"
                        >
                          填入
                        </button>
                        <CopyButton text={item} />
                      </div>
                    </div>
                    <textarea
                      value={item}
                      onChange={(e) => {
                        try {
                          const currentData = JSON.parse(splitResult);
                          const newList = [...currentData.list];
                          newList[index] = e.target.value;
                          setSplitResult(JSON.stringify({
                            ...currentData,
                            list: newList
                          }, null, 2));
                        } catch (e) {
                          console.error('Error updating list item:', e);
                        }
                      }}
                      className="textarea textarea-bordered w-full"
                      rows="2"
                    ></textarea>
                  </div>
                ));
              } else {
                return (
                  <div className="text-center py-4 text-gray-500">
                    <p>暂无题目列表数据</p>

                  </div>
                );
              }
            } catch (e) {
              return (
                <div className="text-center py-4 text-gray-500">
                  <p>暂无题目列表数据</p>

                </div>
              );
            }
          })()}

        </div>
      </div>
      <div className="mt-2">
        <div className="label flex justify-between items-center">
          <span className="label-text">结果</span>
          <div className="flex gap-1 items-center">
            <button
              onClick={() => {
                try {
                  // 解析当前的 splitResult JSON 字符串
                  const parsedResult = JSON.parse(splitResult);
                  // 发送完整的 JSON 对象（包含 text 和 list）
                  chrome.runtime.sendMessage({
                    type: "topic",
                    text: parsedResult
                  });
                } catch (error) {
                  console.error('Error parsing split result:', error);
                  // 如果解析失败，则将当前文本包装为标准格式
                  chrome.runtime.sendMessage({
                    type: "topic",
                    text: {
                      text: splitResult,
                      list: []
                    }
                  });
                }
              }}
              className="btn btn-ghost btn-xs flex items-center"
            >
              填入
            </button>
            <CopyButton text={splitResult} />
          </div>
        </div>
        <textarea
          value={(() => {
            try {
              // 尝试解析 JSON 并只显示 text 字段内容
              const parsed = JSON.parse(splitResult);
              return parsed.text || '';
            } catch (e) {
              // 如果解析失败，则显示原始内容
              return splitResult;
            }
          })()}
          onChange={(e) => {
            try {
              // 尝试解析当前的 splitResult
              const currentData = JSON.parse(splitResult);
              // 更新 text 字段，保留 list 字段
              setSplitResult(JSON.stringify({
                ...currentData,
                text: e.target.value
              }, null, 2));
            } catch (e) {
              // 如果解析失败，直接设置值
              setSplitResult(e.target.value);
            }
          }}
          placeholder="题目切割后的内容"
          className="textarea textarea-bordered textarea-lg w-full h-full min-h-40"
        >
        </textarea>
      </div>
    </div>
  );
};

export default TopicSplitComponent;
