import { printCascaderInputValue, extractText, getSelectedRadioText, getAuditContentDetails, getFillInBlanksValues } from './domUtils.js';

/**
 * Extracts audit content from the current page's editor elements
 * @returns {string} Formatted audit content text
 */
export function extractAuditContent() {
  // 获取题目类型信息
  const cascaderValue = printCascaderInputValue();
  
  // 查找题干、解答和解析的编辑区域
  const stemElement = document.querySelector('[id^="stem-edit-"] .w-e-text');
  const answerElement = document.querySelector('[id^="answer-edit-"] .w-e-text');
  const analysisElement = document.querySelector('[id^="analyse-edit-"] .w-e-text');
  
  // 提取各个部分的内容
  let stemText = stemElement ? extractText(stemElement) : '未找到题干内容';
  const answerText = answerElement ? extractText(answerElement) : '未找到解答内容';
  const analysisText = analysisElement ? extractText(analysisElement) : '未找到解析内容';

  // 组装主题信息
  const subject = cascaderValue || '未知学科';
  
  // 检查是否为单选或填空题，如果是则添加相应内容
  const questionType = getSelectedRadioText();
  if (questionType && questionType.trim() === "单选") {
    // 获取单选题的选项内容
    const optionsContent = getAuditContentDetails();
    if (optionsContent) {
      // 将选项内容添加到题干后面，不添加单独标题
      stemText = `${stemText.trim()}\n\n选项：\n${optionsContent.trim()}`;
    }
  } else if (questionType && questionType.trim() === "填空") {
    // 获取填空题的填空内容
    const blankValues = getFillInBlanksValues();
    if (blankValues) {
      // 将填空内容添加到题干后面，不添加单独标题
      stemText = `${stemText.trim()}\n\n答案：\n${blankValues.trim()}`;
    }
  }

  // 生成格式化的审核文本
  return `
【学科】: ${subject.trim()}

【题干】: 
${stemText.trim()}

【解答】: 
${answerText.trim()}

【解析】: 
${analysisText}
  `.trim();
} 