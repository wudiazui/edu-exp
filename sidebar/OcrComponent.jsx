import React from 'react';
import { useDropzone } from 'react-dropzone';
import CopyButton from './CopyButton.jsx';
import { CozeService } from '../coze.js';

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

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

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
          // Official server logic wrapped in a Promise
          const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              {
                type: 'OCR',
                data: { 'image_data': selectedImage },
                host,
                uname
              },
              (response) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  resolve(response);
                }
              }
            );
          });

          if (response && response.formatted) {
            setRecognizedText(response.formatted);
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

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

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
        <button className="btn btn-wide w-full" onClick={handleRecognition} disabled={isLoading}>
          {isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            "识别文字"
          )}
        </button>
      </div>
      <div className="mt-2">
        <div className="label flex justify-between items-center">
          <span className="label-text">结果</span>
          <div className="flex gap-1 items-center">
            <button
              onClick={() => {
                chrome.runtime.sendMessage({
                  type: "topic",
                  text: recognizedText
                });
              }}
              className="btn btn-ghost btn-xs flex items-center"
            >
              填入
            </button>
            <CopyButton text={recognizedText} />
          </div>
        </div>
        <textarea
          value={recognizedText}
          onChange={(e) => setRecognizedText(e.target.value)}
          placeholder="识别后的文字内容"
          className="textarea textarea-bordered textarea-lg w-full h-full min-h-40"
        >
        </textarea>
      </div>
    </div>
  );
};

export default OcrComponent;
