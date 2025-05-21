import u from "umbrellajs";
/**
 * Finds the input element within a specific cascader structure and prints its value.
 * Uses Umbrella JS for DOM selection.
 */
export function printCascaderInputValue() {
  // Selector: .el-cascader -> .el-input.el-input--suffix -> .el-input__inner
  const inputElement = u('.el-cascader .el-input.el-input--suffix .el-input__inner');

  if (inputElement.length > 0) {
    const value = inputElement.first().value;
    return value; // Optionally return the value
  } else {
    console.log('Cascader input element not found.');
    return null;
  }
}

/**
 * Gets the text content of the selected radio button in a specific radio group.
 * @returns {string|null} The text content of the selected radio button or null if not found.
 */
export function getSelectedRadioText() {
  // Select the radio group using the provided selector
  const radioGroup = u('#app > div > div.main-container > section > div > section > main > div:nth-child(2) > div.el-radio-group');

  if (radioGroup.length === 0) {
    console.log('Radio group not found.');
    return null;
  }

  // Find the selected radio input (the one with checked attribute)
  const selectedRadio = radioGroup.find('.el-radio.is-checked');

  if (selectedRadio.length === 0) {
    console.log('No selected radio found.');
    return null;
  }

  // Get the text content from the radio label
  const labelText = selectedRadio.find('.el-radio__label').text();

  return labelText || null;
}

/**
 * Finds the first element with class="c-margin-bottom-middle el-row",
 * then finds the input with class="el-input__inner" inside it,
 * and sets its value to "见解答".
 * @returns {boolean} True if the operation was successful, false otherwise.
 */
export function setAnswerInputValue() {
  // Find the first element with class="c-margin-bottom-middle el-row"
  const rowElement = u('.c-margin-bottom-middle.el-row').first();

  if (!rowElement) {
    console.log('Row element not found.');
    return false;
  }

  // Find the input with class="el-input__inner" inside the row element
  const inputElement = u(rowElement).find('.el-input__inner').first();

  if (!inputElement) {
    console.log('Input element not found inside the row element.');
    return false;
  }

  // Set the input value to "见解答"
  inputElement.value = "见解答";

  // Trigger an input event to ensure any listeners are notified of the change
  const inputEvent = new Event('input', { bubbles: true });
  inputElement.dispatchEvent(inputEvent);
  return true;
}

/**
 * Gets detailed audit content from the fifth large margin element.
 * Extracts content from c-margin-bottom-middle el-row elements, 
 * including spans in c-title elements and selected radio buttons.
 * @returns {string|null} Formatted content details or null if not found.
 */
export function getAuditContentDetails() {
  // Get the main container with class="el-main c-padding-bottom100"
  const mainContainer = u('.el-main.c-padding-bottom100');

  if (mainContainer.length === 0) {
    console.log('Main container not found.');
    return null;
  }

  // Find all elements with class="c-margin-bottom-large" inside the main container
  const largeMarginElements = mainContainer.find('.c-margin-bottom-large');

  if (largeMarginElements.length < 5) {
    console.log('Less than 5 c-margin-bottom-large elements found.');
    return null;
  }

  // Get the 5th element (index 4 since it's 0-based)
  const fifthElement = largeMarginElements.nodes[4];

  if (!fifthElement) {
    console.log('Fifth large margin element not found.');
    return null;
  }

  // Find all c-margin-bottom-middle el-row elements inside the 5th large margin element
  const rowElements = u(fifthElement).find('.c-margin-bottom-middle.el-row');

  if (rowElements.length <= 1) {
    console.log('Less than 2 row elements found.');
    return null;
  }

  // The array to store our results
  let results = [];

  // Skip the first element and iterate through the rest
  // Start from index 1 to skip the first element
  for (let i = 1; i < rowElements.length; i++) {
    const rowElement = rowElements.nodes[i];
    let contentResults = [];

    // Find the button with class="el-button el-button--mini is-round is-circle"
    const buttonElement = u(rowElement).find('.el-button.el-button--mini.is-round.is-circle');
    const buttonText = buttonElement.length > 0 ? buttonElement.text().trim() : '';

    // Find the element with class="w-e-text"
    const contentElement = u(rowElement).find('.w-e-text');
    const contentText = contentElement.length > 0 ? extractText(contentElement.nodes[0]).trim() : '';

    // Format the output as "button-text. content-text"
    if (buttonText || contentText) {
      contentResults.push(`${buttonText}. ${contentText}`);
    }

    // Add the content results to the main results array
    if (contentResults.length > 0) {
      results.push(contentResults.join('\n'));
    }
  }

  const elrowElement = u(fifthElement).find('.el-row:not(.c-margin-bottom-middle)');
  // Extract text from span elements inside child elements with class="c-title c-margin-bottom-middle"
  const titleElements = u(elrowElement).find('.c-title.c-margin-bottom-middle');
  const titleText = titleElements.text().replace("*", "").trim();

  // Extract the text content of the selected element inside child elements with class="el-radio-group"
  const radioGroups = u(elrowElement).find('.el-radio-group');
  if (radioGroups.length > 0) {
    for (let j = 0; j < radioGroups.length; j++) {
      const radioGroup = radioGroups.nodes[j];
      // Find radios with tabindex="0" and role="radio"
      const selectedRadio = u(radioGroup).find('[tabindex="0"][role="radio"]');

      if (selectedRadio.length > 0) {
        // Get the text from the radio label
        const labelText = selectedRadio.length > 0 ? extractText(selectedRadio.nodes[0]).trim() : '';

        if (labelText) {
          results.push(titleText + " " + labelText);
        }
      }
    }
  } else {
    // 如果没有找到radioGroups，仍然添加titleText
    if (titleText) {
      results.push(titleText);
    }
  }

  return results.join('\n\n');
}

/**
 * Extracts text content from a DOM element, preserving structure like paragraphs and handling special elements like images.
 * This handles different node types appropriately and prevents duplicate text.
 * 
 * @param {Element} element - The DOM element to extract text from
 * @param {Set} seenTexts - Set to track already processed text to prevent duplication
 * @returns {string} The extracted text content with formatting preserved
 */
export function extractText(element, seenTexts = new Set()) {
  if (!element) return '';

  let text = '';
  const childNodes = element.childNodes;

  for (const node of childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      // 保留前后的空格
      const content = node.textContent;
      if (!seenTexts.has(content)) {
        text += content; // 直接添加文本内容
        seenTexts.add(content); // 记录已添加的文本
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // 对于 BR 标签，添加换行符
      if (node.tagName.toLowerCase() === 'br') {
        text += '\n'; // 添加换行符
      } else if (node.tagName.toLowerCase() === 'p') {
        // 逐行提取p标签的文本
        text += extractText(node, seenTexts) + '\n'; // 添加换行符
      } else if (node.tagName.toLowerCase() === 'img') {
        // 提取data-math属性并用$包裹，进行URL解码
        const mathValue = node.getAttribute('data-math');
        if (mathValue) {
          const decodedValue = decodeURIComponent(mathValue); // URL解码
          if (!seenTexts.has(decodedValue)) {
            text += `$${decodedValue}$`; // 用$包裹
            seenTexts.add(decodedValue); // 记录已添加的文本
          }
        } else {
          // 处理非公式图片，包含src属性
          const imgSrc = node.getAttribute('src');
          if (imgSrc && !seenTexts.has(imgSrc)) {
            text += `[图片: ${imgSrc}]`; // 添加图片链接
            seenTexts.add(imgSrc); // 记录已添加的文本
          }
        }
      }
      // 递归处理子元素
      text += extractText(node, seenTexts);
    }
  }
  return text;
}

/**
 * Gets values from input fields with class="el-input__inner" inside elements 
 * with class="c-margin-bottom-middle el-row" (excluding the last one)
 * @returns {string} String of input values separated by '; ' or empty string if elements not found
 */
export function getFillInBlanksValues() {
  // Find all elements with class="c-margin-bottom-middle el-row"
  const rowElements = u('.c-margin-bottom-middle.el-row');
  console.log('rowElements length:', rowElements.length);

  if (rowElements.length === 0) {
    console.log('No row elements found.');
    return null;
  }

  // The array to store our results
  let results = [];

  // Loop through all row elements
  for (let i = 0; i < rowElements.length; i++) {
    const rowElement = rowElements.nodes[i];
    
    // Find the input element within this row
    const inputElement = u(rowElement).find('.el-input__inner');
    
    if (inputElement.length > 0) {
      // Get the input value
      const value = inputElement.first().value || '';
      console.log(`Input ${i} value:`, value);
      results.push(value);
    } else {
      console.log(`No input element found in row ${i}`);
    }
  }

  // Always return a string
  return results.join('; ');
}
