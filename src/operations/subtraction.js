/**
 * Subtraction operations module
 */

import { checkPoint, trimZero } from '../utils/stringUtils.js';

/**
 * 减法竖式计算
 * @param {string} minuend - 被减数
 * @param {string} subtrahend - 减数
 * @returns {object} 包含差与计算过程的对象
 */
function subtractionVertical(minuend, subtrahend) {
    // 预处理输入
    minuend = trimZero(minuend);
    subtrahend = trimZero(subtrahend);
    
    // 检查是否需要交换被减数和减数（处理负数结果）
    let isNegative = false;
    let originalMinuend = minuend;
    let originalSubtrahend = subtrahend;
    
    if (parseFloat(minuend) < parseFloat(subtrahend)) {
        isNegative = true;
        minuend = originalSubtrahend;
        subtrahend = originalMinuend;
    }
    
    // 计算减法
    let result = calculateSubtraction(minuend, subtrahend);
    
    // 返回计算结果和过程
    return {
        minuend: originalMinuend,
        subtrahend: originalSubtrahend,
        difference: result.difference,
        borrows: result.borrows,
        isNegative: isNegative
    };
}

/**
 * 计算减法
 * @param {string} minuend - 被减数
 * @param {string} subtrahend - 减数
 * @returns {object} 包含差与借位信息的对象
 */
function calculateSubtraction(minuend, subtrahend) {
    // 处理小数点
    let dot_pos1 = checkPoint(minuend, 0);
    let dot_pos2 = checkPoint(subtrahend, 0);
    
    // 检查是否需要处理负数
    let isNegative = false;
    if (parseFloat(minuend) < parseFloat(subtrahend)) {
        isNegative = true;
        let temp = minuend;
        minuend = subtrahend;
        subtrahend = temp;
        
        // 重新计算小数点位置
        dot_pos1 = checkPoint(minuend, 0);
        dot_pos2 = checkPoint(subtrahend, 0);
    }
    
    // 对齐小数点
    let gf1 = minuend.split('');
    let gf2 = subtrahend.split('');
    
    // 处理小数部分对齐
    let ld1 = 0, ld2 = 0;
    
    if (dot_pos1 !== -1) {
        ld1 = minuend.length - dot_pos1 - 1;
    }
    
    if (dot_pos2 !== -1) {
        ld2 = subtrahend.length - dot_pos2 - 1;
    }
    
    // 补齐小数位数
    if (ld2 > ld1) {
        if (ld1 === 0) {
            gf1.push('.');
        }
        for (let i = 0; i < ld2 - ld1; i++) {
            gf1.push('0');
        }
    } else if (ld1 > ld2) {
        if (ld2 === 0) {
            gf2.push('.');
        }
        for (let i = 0; i < ld1 - ld2; i++) {
            gf2.push('0');
        }
    }
    
    // 去掉小数点进行计算
    let s1 = gf1.join('').replace('.', '');
    let s2 = gf2.join('').replace('.', '');
    
    // 确保s1长度不小于s2
    while (s2.length < s1.length) {
        s2 = "0" + s2;
    }
    
    let difference = "";
    let borrow = 0;
    let borrows = [];
    
    // 从右向左逐位相减
    for (let i = s1.length - 1; i >= 0; i--) {
        let digit1 = parseInt(s1[i]) - borrow;
        let digit2 = parseInt(s2[i]);
        
        if (digit1 < digit2) {
            digit1 += 10;
            borrow = 1;
            borrows.push({position: i - 1});
        } else {
            borrow = 0;
        }
        
        let digitDiff = digit1 - digit2;
        difference = digitDiff + difference;
    }
    
    // 处理小数点
    let finalDifference = difference;
    let decimalPlaces = Math.max(ld1, ld2);
    
    if (decimalPlaces > 0) {
        // 插入小数点
        let insertPos = difference.length - decimalPlaces;
        if (insertPos > 0) {
            finalDifference = difference.slice(0, insertPos) + "." + difference.slice(insertPos);
        } else {
            // 如果小数点需要在最前面，先补0
            finalDifference = "0." + difference;
        }
    }
    
    // 处理负数
    if (isNegative) {
        finalDifference = "-" + finalDifference;
    }
    
    // 去除多余的前导零和尾随零
    finalDifference = trimZero(finalDifference);
    
    return {
        difference: finalDifference,
        borrows: borrows
    };
}

export {
    subtractionVertical,
    calculateSubtraction
}; 