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
