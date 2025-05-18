import React from 'react';
import CopyButton from './CopyButton.jsx';
import { CozeService } from '../coze.js';
import { ocr_text } from '../lib.js'; // 导入ocr_text函数
import ImageUploader from './ImageUploader.jsx'; // 引入新的ImageUploader组件

const OcrComponent = ({ host, uname, serverType }) => {
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [recognizedText, setRecognizedText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [cozeService, setCozeService] = React.useState(null);

  // Initialize CozeService when serverType is "扣子"
  React.useEffect(() => {
    if (serverType === "扣子") {
      chrome.storage.sync.get(['kouziAccessKey', 'kouziOcrWorkflowId'], (result) => {
        if (result.kouziAccessKey && result.kouziOcrWorkflowId) {
          setCozeService(new CozeService(result.kouziAccessKey));
        }
      });
    }
  }, [serverType]);

  const handleRecognition = async () => {
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
            chrome.storage.sync.get(['kouziOcrWorkflowId', 'kouziAppId'], resolve);
          });

          // Upload file and execute workflow
          const uploadResult = await cozeService.uploadFile(file);
          console.log(uploadResult);

          const workflowResult = await cozeService.executeWorkflow(result.kouziOcrWorkflowId, {
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
              
              if (parsedData && parsedData.text) {
                setRecognizedText(parsedData.text);
              } else {
                setRecognizedText('识别失败：未获取到识别结果');
              }
            } catch (error) {
              console.error('Error parsing workflow result:', error);
              setRecognizedText('识别失败：数据解析错误');
            }
          } else {
            setRecognizedText('识别失败：未获取到识别结果');
          }
        } else {
          // 直接调用ocr_text函数而不是通过background.js
          const formattedText = await ocr_text({ 'image_data': selectedImage }, host, uname);
          
          if (formattedText) {
            setRecognizedText(formattedText);
          } else {
            setRecognizedText('识别失败：未获取到有效的识别结果');
          }
        }
      } catch (error) {
        console.error('Error in OCR:', error);
        setRecognizedText('识别失败：' + (error.message || '未知错误'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="container max-auto w-full">
      <div className="flex flex-col gap-2">
        <ImageUploader
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          placeholder="可以直接粘贴图片"
          showDeleteButton={true}
          maxPreviewWidth={300}
          maxPreviewHeight={180}
        />
        <button
          onClick={handleRecognition}
          disabled={!selectedImage || isLoading}
          className={`btn btn-primary btn-sm w-full ${isLoading ? 'opacity-90' : ''}`}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-xs mr-2"></span>
              <span>识别中...</span>
            </>
          ) : (
            "识别文字"
          )}
        </button>
      </div>
      <div className="mt-2">
        <div className="label flex justify-between items-center py-1">
          <span className="label-text text-sm font-medium">结果</span>
          <div className="flex gap-1 items-center">
            <button
              onClick={() => {
                chrome.runtime.sendMessage({
                  type: "topic",
                  text: recognizedText
                });
              }}
              className="btn btn-xs btn-outline flex items-center gap-1"
            >
              填入
            </button>
            <CopyButton text={recognizedText} />
          </div>
        </div>
        <textarea
          value={recognizedText}
          onChange={(e) => setRecognizedText(e.target.value)}
          placeholder="识别结果将显示在这里"
          className="textarea textarea-bordered w-full min-h-32 text-sm"
        ></textarea>
      </div>
    </div>
  );
};

export default OcrComponent;
