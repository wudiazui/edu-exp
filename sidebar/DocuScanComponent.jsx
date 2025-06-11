import React from 'react';

const DocuScanComponent = () => {
  return (
    <div className="w-full h-full flex flex-col" style={{ height: 'calc(100vh - 60px)' }}>
      <iframe 
        src="https://ds.pingfury.top/" 
        className="w-full h-full border-none flex-grow" 
        title="DocuScan - 智能图片处理工具"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      ></iframe>
    </div>
  );
};

export default DocuScanComponent; 