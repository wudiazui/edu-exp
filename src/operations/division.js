/**
 * Division operations module
 */

import { trimZero } from '../utils/stringUtils.js';

/**
 * 除法竖式计算
 * @param {string} beichushu - 被除数
 * @param {string} chushu - 除数
 * @returns {object} 包含商和计算过程的对象
 */
function divisionVertical(beichushu, chushu) {
    // 预处理输入
    beichushu = trimZero(beichushu);
    chushu = trimZero(chushu);
    
    // 检查除数是否为0
    if (parseFloat(chushu) === 0) {
        return {
            dividend: beichushu,
            divisor: chushu,
            quotient: "除数不能为0",
            steps: []
        };
    }
    
    // 处理除法计算
    let result = processDiv(beichushu, chushu);
    
    // 返回计算结果和过程
    return {
        dividend: beichushu,
        divisor: chushu,
        quotient: result.shang,
        steps: result.steps
    };
}

/**
 * 处理除法计算
 * @param {string} v1 - 被除数
 * @param {string} v2 - 除数
 * @returns {object} 包含商和计算步骤的对象
 */
function processDiv(v1, v2) {
    // 预处理输入
    let s1 = v1.toString();
    let s2 = v2.toString();
    let pos1 = s1.indexOf(".");
    let pos2 = s2.indexOf(".");
    
    // 计算结果
    let res;
    
    // 处理整数除法
    if (pos1 < 0 && pos2 < 0) {
        res = parseInt(v1) / parseInt(v2);
    }
    // 处理除数有小数点的情况
    else if (pos1 < 0) {
        let fact = s2.length - pos2 - 1;
        let sn = s2.substring(0, pos2) + s2.substring(pos2 + 1, s2.length);
        
        // 被除数补零
        let s1WithZeros = s1;
        for (let i = 0; i < fact; i++) {
            s1WithZeros += "0";
        }
        
        res = parseInt(s1WithZeros) / parseInt(sn);
    }
    // 处理被除数有小数点的情况
    else if (pos2 < 0) {
        let fact = s1.length - pos1 - 1;
        let sn = s1.substring(0, pos1) + s1.substring(pos1 + 1, s1.length);
        
        // 除数补零
        let s2WithZeros = s2;
        for (let i = 0; i < fact; i++) {
            s2WithZeros += "0";
        }
        
        res = parseInt(sn) / parseInt(s2WithZeros);
    }
    // 处理两者都有小数点的情况
    else {
        let fact1 = s1.length - pos1 - 1;
        let fact2 = s2.length - pos2 - 1;
        
        let sn1 = s1.substring(0, pos1) + s1.substring(pos1 + 1, s1.length);
        let sn2 = s2.substring(0, pos2) + s2.substring(pos2 + 1, s2.length);
        
        // 对齐小数位数
        if (fact1 < fact2) {
            for (let i = 0; i < fact2 - fact1; i++) {
                sn1 += "0";
            }
        } else if (fact1 > fact2) {
            for (let i = 0; i < fact1 - fact2; i++) {
                sn2 += "0";
            }
        }
        
        res = parseInt(sn1) / parseInt(sn2);
    }
    
    // 处理结果
    let s = res.toString();
    let pos = s.indexOf(".");
    if (pos >= 0) {
        // 限制小数位数
        s = s.substring(0, Math.min(pos + 7, s.length));
        // 去除末尾的0
        while (s.charAt(s.length - 1) === "0") {
            s = s.substring(0, s.length - 1);
        }
        // 如果小数点在最后，去除小数点
        if (s.charAt(s.length - 1) === ".") {
            s = s.substring(0, s.length - 1);
        }
    }
    
    // 模拟长除法计算步骤
    let steps = [];
    
    // 准备计算数据
    let dividend = v1;
    let divisor = v2;
    
    // 移除小数点进行计算
    if (pos1 >= 0 || pos2 >= 0) {
        // 计算需要移动的小数位数
        let decimalPlaces = 0;
        if (pos1 >= 0) {
            decimalPlaces += (s1.length - pos1 - 1);
        }
        if (pos2 >= 0) {
            decimalPlaces -= (s2.length - pos2 - 1);
        }
        
        // 移除小数点
        dividend = s1.replace(".", "");
        divisor = s2.replace(".", "");
        
        // 根据小数位数调整被除数
        if (decimalPlaces > 0) {
            for (let i = 0; i < decimalPlaces; i++) {
                dividend += "0";
            }
        } else if (decimalPlaces < 0) {
            for (let i = 0; i < -decimalPlaces; i++) {
                divisor += "0";
            }
        }
    }
    
    // 转换为整数进行计算
    let intDividend = parseInt(dividend);
    let intDivisor = parseInt(divisor);
    
    // 执行长除法计算
    let currentDividend = dividend.toString();
    let currentDivisor = divisor.toString();
    let quotient = "";
    
    // 模拟手工长除法计算过程
    let index = 0;
    let tempDividend = "";
    
    while (index < currentDividend.length) {
        // 添加下一位到临时被除数
        tempDividend += currentDividend.charAt(index);
        
        // 如果临时被除数小于除数，且不是最后一位，则继续添加下一位并在商中添加0
        if (parseInt(tempDividend) < intDivisor) {
            if (index > 0) { // 不是第一位时才添加0到商
                quotient += "0";
            }
            index++;
            continue;
        }
        
        // 计算当前位的商
        let digitQuotient = Math.floor(parseInt(tempDividend) / intDivisor);
        quotient += digitQuotient.toString();
        
        // 计算当前位的乘积和余数
        let product = digitQuotient * intDivisor;
        let remainder = parseInt(tempDividend) - product;
        
        // 记录计算步骤
        steps.push({
            subtraction: product.toString(),
            remainder: remainder.toString(),
            position: index - tempDividend.length + 1 // 记录当前步骤的位置
        });
        
        // 更新临时被除数为余数
        tempDividend = remainder.toString();
        
        // 移动到下一位
        index++;
        
        // 如果余数为0且已经处理完所有位，则结束计算
        if (remainder === 0 && index >= currentDividend.length) {
            break;
        }
    }
    
    return {
        shang: s,
        steps: steps
    };
}

export {
    divisionVertical,
    processDiv
}; 