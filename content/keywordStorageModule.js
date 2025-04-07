// keywordStorageModule.js - 关键词存储模块
// No notification import needed

// 使用不同的存储键名，避免与 filterModule.js 冲突
const STORAGE_KEYS = {
  INCLUDE: 'clue_include_keywords',
  EXCLUDE: 'clue_exclude_keywords'
};

// 从 Chrome 存储中加载关键词
function loadKeywords() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEYS.INCLUDE, STORAGE_KEYS.EXCLUDE], (result) => {
      const keywords = {
        includeKeywords: result[STORAGE_KEYS.INCLUDE] || [],
        excludeKeywords: result[STORAGE_KEYS.EXCLUDE] || []
      };
      resolve(keywords);
    });
  });
}

// 保存关键词到 Chrome 存储
function saveKeywords(includeKeywords, excludeKeywords) {
  return new Promise((resolve) => {
    const data = {};
    data[STORAGE_KEYS.INCLUDE] = includeKeywords;
    data[STORAGE_KEYS.EXCLUDE] = excludeKeywords;
    
    chrome.storage.sync.set(data, () => {
      resolve(true);
    });
  });
}

// 添加单个关键词
function addKeyword(keyword, keywordsArray) {
  if (keyword && !keywordsArray.includes(keyword)) {
    keywordsArray.push(keyword);
    return true;
  }
  return false;
}

// 删除单个关键词
function removeKeyword(keyword, keywordsArray) {
  const index = keywordsArray.indexOf(keyword);
  if (index !== -1) {
    keywordsArray.splice(index, 1);
    return true;
  }
  return false;
}

// 导出模块函数
export {
  loadKeywords,
  saveKeywords,
  addKeyword,
  removeKeyword
};
