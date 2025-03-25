import { removeEmptyLinesFromString } from './text.js';

// Test case
const input = "\\(\\frac{4}{25}×33+\\frac{4}{25}×67\\) \\(=\\frac{4}{25}×(33 + 67)\\) \\(=\\frac{4}{25}×100\\) \\(= 16\\) \\(48×(\\frac{7}{12}+2)÷\\frac{2}{3}\\) \\(=(48×\\frac{7}{12}+48×2)÷\\frac{2}{3}\\) \\(=(28 + 96)÷\\frac{2}{3}\\) \\(= 124÷\\frac{2}{3}\\) \\(= 124×\\frac{3}{2}\\) \\(= 186\\) \\(46×\\frac{26}{7}÷\\frac{23}{7}\\) \\(=46×\\frac{26}{7}×\\frac{7}{23}\\) \\(=46×\\frac{26}{23}\\) \\(= 52\\)";

console.log("Input text:\n");
console.log(input);
console.log("\nProcessed output:\n");
console.log(removeEmptyLinesFromString(input)); 