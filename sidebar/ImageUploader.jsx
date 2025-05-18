import React, { useState, useEffect } from 'react';

// 图片压缩和转换函数
async function compressAndConvertToBase64(blob, quality = 0.7, maxWidth = 1200) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // 从blob创建一个临时URL
    const url = URL.createObjectURL(blob);
    img.src = url;
    
    // 使用后释放URL
    img.onload = function() {
      URL.revokeObjectURL(url);
      
      // 计算新的尺寸，保持宽高比
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.floor(height * ratio);
      }
      
      // 创建canvas并绘制调整大小后的图片
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // 将canvas转换为压缩后的base64字符串
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    img.onerror = reject;
  });
}

const ImageUploader = ({ 
  selectedImage, 
  setSelectedImage, 
  placeholder = "可以直接粘贴图片",
  showDeleteButton = true,
  maxPreviewWidth = 300,
  maxPreviewHeight = 180
}) => {
  const [imagePreviewSize, setImagePreviewSize] = useState({ width: maxPreviewWidth, height: 'auto' });

  // 监听来自 background 的图片消息 (可选，根据实际需求选择是否添加)
  useEffect(() => {
    const messageListener = (message) => {
      if (message.type === 'SET_IMAGE' && message.data) {
        // 直接设置图片数据
        setSelectedImage(message.data);
        
        // 创建图像对象获取尺寸信息
        const img = new Image();
        img.onload = () => {
          // 计算预览尺寸
          const ratio = img.width > maxPreviewWidth ? maxPreviewWidth / img.width : 1;
          const previewWidth = Math.floor(img.width * ratio);
          const previewHeight = Math.floor(img.height * ratio);
          
          setImagePreviewSize({
            width: previewWidth,
            height: previewHeight
          });
        };
        img.src = message.data;
      }
    };
    
    // 添加消息监听器
    chrome.runtime.onMessage.addListener(messageListener);
    
    // 组件卸载时移除监听器
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [maxPreviewWidth, setSelectedImage]);

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
            // Calculate appropriate preview size
            const ratio = img.width > maxPreviewWidth ? maxPreviewWidth / img.width : 1;
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

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center"
      onPaste={onPaste}
      tabIndex="0"
    >
      <input
        type="text"
        className="input input-bordered input-sm w-full mb-2"
        placeholder={placeholder}
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
              maxHeight: `${maxPreviewHeight}px`,
              objectFit: 'contain'
            }}
          />
          {showDeleteButton && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              className="btn btn-xs btn-error mt-2 text-xs"
            >
              删除图片
            </button>
          )}
        </div>
      ) : (
        <div className="text-gray-500 py-3">
          <p>直接粘贴图片</p>
          <p className="text-xs mt-1">支持截图直接粘贴</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 