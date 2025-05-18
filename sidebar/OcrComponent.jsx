import React from 'react';
import { useDropzone } from 'react-dropzone';
import CopyButton from './CopyButton.jsx';
import { CozeService } from '../coze.js';
import { ocr_text } from '../lib.js'; // 导入ocr_text函数

const OcrComponent = ({ host, uname, serverType }) => {
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [recognizedText, setRecognizedText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [cozeService, setCozeService] = React.useState(null);
  const [imagePreviewSize, setImagePreviewSize] = React.useState({ width: 300, height: 'auto' });

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
        // Create an image to get dimensions
        const img = new Image();
        img.onload = () => {
          // Calculate appropriate preview size (max width 300px)
          const maxWidth = 300;
          const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
          setImagePreviewSize({
            width: Math.floor(img.width * ratio),
            height: Math.floor(img.height * ratio)
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const onPaste = (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImage(reader.result);
          // Create an image to get dimensions
          const img = new Image();
          img.onload = () => {
            // Calculate appropriate preview size (max width 300px)
            const maxWidth = 300;
            const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
            setImagePreviewSize({
              width: Math.floor(img.width * ratio),
              height: Math.floor(img.height * ratio)
            });
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
        event.preventDefault();
        break;
      }
    }
  };
  
  // Handle file input change
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        // Create an image to get dimensions
        const img = new Image();
        img.onload = () => {
          // Calculate appropriate preview size (max width 300px)
          const maxWidth = 300;
          const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
          setImagePreviewSize({
            width: Math.floor(img.width * ratio),
            height: Math.floor(img.height * ratio)
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
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

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="container max-auto w-full">
      <div className="flex flex-col gap-2">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center"
          onPaste={onPaste}
          tabIndex="0"
        >
          <input
            type="text"
            className="input input-bordered input-sm w-full mb-2"
            placeholder="可以直接粘贴图片"
            onPaste={onPaste}
          />
          {selectedImage ? (
            <div className="flex flex-col items-center">
              <img
                src={selectedImage}
                alt="Selected"
                style={{
                  width: `${imagePreviewSize.width}px`,
                  height: imagePreviewSize.height === 'auto' ? 'auto' : `${imagePreviewSize.height}px`,
                  maxHeight: '180px',
                  objectFit: 'contain'
                }}
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(null);
                }}
                className="btn btn-xs btn-error mt-2 text-xs"
              >
                删除图片
              </button>
            </div>
          ) : (
            <div className="text-gray-500 py-3">
              <p>直接粘贴图片</p>
              <p className="text-xs mt-1">支持截图直接粘贴</p>
            </div>
          )}
        </div>
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
              className="btn btn-ghost btn-xs btn-sm flex items-center text-xs"
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
          className="textarea textarea-bordered textarea-md w-full h-full min-h-32"
        >
        </textarea>
      </div>
    </div>
  );
};

export default OcrComponent;
