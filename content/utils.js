/**
 * 工具函数模块 - 包含各种通用工具函数
 */

/**
 * 使用正则表达式检查文本是否匹配关键词列表
 * @param {string} text - 要检查的文本
 * @param {string[]} keywords - 关键词列表
 * @param {boolean} matchAll - 如果为true，则必须匹配所有关键词；如果为false，则匹配任一关键词即可
 * @returns {boolean} - 返回是否匹配
 */
export function matchKeywords(text, keywords, matchAll = false) {
  if (!text || !keywords || keywords.length === 0) {
    return !matchAll; // 如果没有关键词，matchAll=true时返回false，否则返回true
  }

  const matchFunction = keyword => {
    // 转义正则表达式特殊字符
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escapedKeyword, 'i').test(text);
  };

  // 根据matchAll参数决定使用every还是some
  return matchAll 
    ? keywords.every(matchFunction) 
    : keywords.some(matchFunction);
}

/**
 * 检查文本是否满足包含和排除关键词的条件
 * @param {string} text - 要检查的文本
 * @param {string[]} includeKeywords - 包含关键词列表（为空时视为全部匹配）
 * @param {string[]} excludeKeywords - 排除关键词列表
 * @returns {boolean} - 返回是否满足条件（需同时满足：匹配包含关键词且不匹配排除关键词）
 */
export function filterByKeywords(text, includeKeywords = [], excludeKeywords = []) {
  // 检查包含关键词 - 如果包含关键词列表为空，则所有文本都匹配；否则至少包含一个关键词
  const includeMatch = includeKeywords.length === 0 || matchKeywords(text, includeKeywords);
  
  // 检查排除关键词 - 如果包含任何排除关键词，则该文本应被排除
  const excludeMatch = excludeKeywords.length > 0 && matchKeywords(text, excludeKeywords);
  
  // 只有满足包含条件且不满足排除条件的文本才会被保留
  return includeMatch && !excludeMatch;
}

// 导出其他工具函数...
