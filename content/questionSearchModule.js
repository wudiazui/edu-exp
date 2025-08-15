// 题干搜索模块 - Content Script 部分
// 只负责获取DOM元素的图片地址

/**
 * 获取指定XPath的图片URL
 * @param {string} xpath - 图片元素的XPath
 * @returns {string|null} 返回图片src值，失败返回null
 */
function getImageUrlFromXPath(xpath) {
  try {
    // 使用XPath查找图片元素
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    
    const imgElement = result.singleNodeValue;
    if (!imgElement || imgElement.tagName !== 'IMG') {
      console.error('[Content] 未找到指定XPath的图片元素:', xpath);
      return null;
    }

    // 直接读取图片的src值
    const imgSrc = imgElement.src;
    if (!imgSrc) {
      console.error('[Content] 图片元素没有src属性');
      return null;
    }

    console.log('[Content] 读取到图片src:', imgSrc);
    return imgSrc;
  } catch (error) {
    console.error('[Content] 获取图片src失败:', error);
    return null;
  }
}

/**
 * 执行题干搜索的主要函数（Content Script部分）
 * 只负责获取图片src，然后返回
 * @returns {string} 图片src值
 */
function executeQuestionSearch() {
  // 指定的XPath
  const targetXPath = '//*[@id="app"]/div/div[2]/section/div/section/aside/div/div[3]/div[1]/div[2]/img';
  
  console.log('[Content] 开始读取图片src...');
  
  // 直接获取图片src
  const imageSrc = getImageUrlFromXPath(targetXPath);
  if (!imageSrc) {
    throw new Error('无法获取指定位置的图片src');
  }
  
  console.log('[Content] 图片src读取成功:', imageSrc);
  return imageSrc;
}

// 导出模块函数
export {
  getImageUrlFromXPath,
  executeQuestionSearch
};
