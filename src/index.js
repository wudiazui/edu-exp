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

/**
 * 生成竖式计算图像
 * 兼容旧版math.js中的generateVerticalArithmeticImage函数
 * @param {string} expression - 计算表达式，如"123+456"
 * @returns {Promise<Blob>} 包含竖式计算的图像Blob
 */
export async function generateVerticalArithmeticImage(expression) {
    // 解析表达式
    const result = parseExpression(expression);
    
    // 设置渲染选项
    const options = {
        fontSize: 16,
        fontFamily: 'Times New Roman',
        color: '#000000',
        backgroundColor: '#FFFFFF',
        showSteps: true,
        autoResize: true,
        // 设置初始画布大小为较小的值，让autoResize功能动态调整
        width: 200,
        height: 200
    };
    
    // 渲染竖式计算
    const canvas = renderVerticalCalculation(result.type, result.numbers, options);
    
    // 转换为Blob并返回Promise
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    });
}

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