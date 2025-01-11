import React from 'react';
import { useDropzone } from 'react-dropzone';
import CopyButton from './CopyButton.jsx';


const OcrComponent = ({ host, uname }) => {
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [recognizedText, setRecognizedText] = React.useState("");

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

    const handleRecognition = () => {
      if (selectedImage) {
        chrome.runtime.sendMessage(
          { type: 'OCR',
            data: { 'image_data': selectedImage },
            host,
            uname
          }, (response) => {
            if (response && response.formatted) {
              setRecognizedText(response.formatted);
            }
          });
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
          <button className="btn btn-wide w-full" onClick={handleRecognition}>识别文字</button>
        </div>
        <div className="mt-2">
          <div className="label flex justify-between items-center">
            <span className="label-text">结果</span>
            <CopyButton text={recognizedText} />
          </div>
          <textarea
            value={recognizedText}
            onChange={(e) => setRecognizedText(e.target.value)}
            placeholder="识别后的文字内容"
            className="textarea textarea-bordered textarea-lg w-full h-full"
          >
          </textarea>
        </div>
      </div>
    );
};

export default OcrComponent;
