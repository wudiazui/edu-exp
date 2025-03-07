/**
 * 竖式计算库
 * 提供加减乘除四则运算的竖式计算功能
 */

// 导入工具函数
import {
    checkPoint,
    trimLeftZero,
    trimZero,
    displayValue,
    addStrings,
    compareStrings
} from './utils/stringUtils.js';

// 导入计算操作
import { additionVertical, calculateAddition } from './operations/addition.js';
import { subtractionVertical, calculateSubtraction } from './operations/subtraction.js';
import { multiplicationVertical, calculateMultiplication } from './operations/multiplication.js';
import { divisionVertical, processDiv } from './operations/division.js';

// 导入渲染函数
import {
    renderVerticalCalculation,
    drawDivisionStruct,
    insertVerticalCalculationImage,
    parseExpression
} from './rendering/common.js';

// 导出所有函数，保持与原始 math_new.js 相同的接口
export {
    // 计算操作
    divisionVertical,
    multiplicationVertical,
    additionVertical,
    subtractionVertical,
    
    // 工具函数
    displayValue,
    trimZero,
    
    // 渲染函数
    renderVerticalCalculation,
    insertVerticalCalculationImage,
    parseExpression
}; 