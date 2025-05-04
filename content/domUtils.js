import u from "umbrellajs";
/**
 * Finds the input element within a specific cascader structure and prints its value.
 * Uses Umbrella JS for DOM selection.
 */
export function printCascaderInputValue() {
  console.log('printCascaderInputValue');
  // Selector: .el-cascader -> .el-input.el-input--suffix -> .el-input__inner
  const inputElement = u('.el-cascader .el-input.el-input--suffix .el-input__inner');

  if (inputElement.length > 0) {
    const value = inputElement.first().value;
    console.log('Cascader Input Value:', value);
    return value; // Optionally return the value
  } else {
    console.log('Cascader input element not found.');
    return null;
  }
}
