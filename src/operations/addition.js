/**
 * Addition operations module
 */

import { checkPoint, trimZero } from '../utils/stringUtils.js';

/**
 * 加法竖式计算
 * @param {string} addend1 - 加数1
 * @param {string} addend2 - 加数2
 * @returns {object} 包含和与计算过程的对象
 */
function additionVertical(addend1, addend2) {
    // 预处理输入
    addend1 = trimZero(addend1);
    addend2 = trimZero(addend2);
    
    // 计算加法
    let result = calculateAddition(addend1, addend2);
    
    // 返回计算结果和过程
    return {
        addend1: addend1,
        addend2: addend2,
        sum: result.sum,
        carries: result.carries
    };
}

/**
 * 计算加法
 * @param {string} addend1 - 加数1
 * @param {string} addend2 - 加数2
 * @returns {object} 包含和与进位信息的对象
 */
function calculateAddition(addend1, addend2) {
    // 处理小数点
    let dot_pos1 = checkPoint(addend1, 0);
    let dot_pos2 = checkPoint(addend2, 0);
    
    // 对齐小数点
    let a1 = addend1;
    let a2 = addend2;
    
    if (dot_pos1 != -1 && dot_pos2 != -1) {
        // 两个数都有小数点
        let decimal1 = addend1.length - dot_pos1 - 1;
        let decimal2 = addend2.length - dot_pos2 - 1;
        
        if (decimal1 < decimal2) {
            a1 = addend1 + "0".repeat(decimal2 - decimal1);
        } else if (decimal2 < decimal1) {
            a2 = addend2 + "0".repeat(decimal1 - decimal2);
        }
    } else if (dot_pos1 != -1) {
        // 只有第一个数有小数点
        a2 = addend2 + "." + "0".repeat(addend1.length - dot_pos1 - 1);
    } else if (dot_pos2 != -1) {
        // 只有第二个数有小数点
        a1 = addend1 + "." + "0".repeat(addend2.length - dot_pos2 - 1);
    }
    
    // 去掉小数点进行计算
    let s1 = a1.replace(".", "");
    let s2 = a2.replace(".", "");
    
    // 确保s1长度不小于s2
    if (s1.length < s2.length) {
        let temp = s1;
        s1 = s2;
        s2 = temp;
    }
    
    // 对齐数字
    while (s2.length < s1.length) {
        s2 = "0" + s2;
    }
    
    let sum = "";
    let carry = 0;
    let carries = [];
    
    // 从右向左逐位相加
    for (let i = s1.length - 1; i >= 0; i--) {
        let digit1 = parseInt(s1[i]);
        let digit2 = parseInt(s2[i]);
        
        let digitSum = digit1 + digit2 + carry;
        carry = Math.floor(digitSum / 10);
        sum = (digitSum % 10) + sum;
        
        if (carry > 0) {
            carries.push({position: i - 1, value: carry});
        }
    }
    
    if (carry > 0) {
        sum = carry + sum;
    }
    
    // 处理小数点
    let finalSum = sum;
    if (dot_pos1 != -1 || dot_pos2 != -1) {
        let decimalPlaces = Math.max(
            dot_pos1 != -1 ? addend1.length - dot_pos1 - 1 : 0,
            dot_pos2 != -1 ? addend2.length - dot_pos2 - 1 : 0
        );
        
        if (decimalPlaces > 0) {
            finalSum = sum.slice(0, -decimalPlaces) + "." + sum.slice(-decimalPlaces);
        }
    }
    
    return {
        sum: trimZero(finalSum),
        carries: carries
    };
}

export {
    additionVertical,
    calculateAddition
}; 