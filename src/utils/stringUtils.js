/**
 * String utility functions for mathematical operations
 */

/**
 * 检查小数点位置
 * @param {string} s - 输入字符串
 * @param {number} j - 起始位置
 * @returns {number} 小数点位置，如果没有则返回-1
 */
function checkPoint(s, j) {
    for (let i = j; i < s.length; i++) {
        if (s[i] === '.') {
            return i;
        }
    }
    return -1;
}

/**
 * 去除字符串左侧的零
 * @param {string} s - 输入字符串
 * @returns {string} 去除左侧零后的字符串
 */
function trimLeftZero(s) {
    if (s === "0" || s === "") return "0";
    
    let i = 0;
    while (i < s.length && s[i] === '0') {
        i++;
    }
    
    // 如果全是零，则返回"0"
    if (i === s.length) return "0";
    
    return s.substring(i);
}

/**
 * 去除字符串中不必要的零
 * @param {string} s - 输入字符串
 * @returns {string} 处理后的字符串
 */
function trimZero(s) {
    if (s === "0" || s === "") return "0";
    
    // 处理负号
    let isNegative = s[0] === '-';
    let str = isNegative ? s.substring(1) : s;
    
    // 去除左侧零
    let i = 0;
    while (i < str.length && str[i] === '0' && str[i+1] !== '.') {
        i++;
    }
    
    // 如果全是零，则返回"0"
    if (i === str.length) return "0";
    
    let result = str.substring(i);
    
    // 处理小数点后的尾随零
    let dotPos = result.indexOf('.');
    if (dotPos !== -1) {
        let j = result.length - 1;
        while (j > dotPos && result[j] === '0') {
            j--;
        }
        
        // 如果小数点后全是零，则去掉小数点
        if (j === dotPos) {
            result = result.substring(0, dotPos);
        } else {
            result = result.substring(0, j + 1);
        }
    }
    
    return isNegative ? '-' + result : result;
}

/**
 * 格式化显示数值
 * @param {string} x - 输入数值
 * @returns {string} 格式化后的数值
 */
function displayValue(x) {
    if (!x || x === "") return "0";
    
    // 处理负号
    let isNegative = x[0] === '-';
    let str = isNegative ? x.substring(1) : x;
    
    // 处理小数点
    let parts = str.split('.');
    let intPart = parts[0] || "0";
    let decimalPart = parts.length > 1 ? parts[1] : "";
    
    // 添加千位分隔符
    let formattedInt = "";
    for (let i = 0; i < intPart.length; i++) {
        if (i > 0 && (intPart.length - i) % 3 === 0) {
            formattedInt += ",";
        }
        formattedInt += intPart[i];
    }
    
    // 组合结果
    let result = formattedInt;
    if (decimalPart) {
        result += "." + decimalPart;
    }
    
    return isNegative ? '-' + result : result;
}

/**
 * 辅助函数: 字符串加法
 * @param {string} num1 - 数字1
 * @param {string} num2 - 数字2
 * @returns {string} 两数之和
 */
function addStrings(num1, num2) {
    let i = num1.length - 1;
    let j = num2.length - 1;
    let carry = 0;
    let result = "";
    
    while (i >= 0 || j >= 0) {
        let x = i >= 0 ? parseInt(num1[i]) : 0;
        let y = j >= 0 ? parseInt(num2[j]) : 0;
        let sum = x + y + carry;
        
        carry = Math.floor(sum / 10);
        result = (sum % 10) + result;
        
        i--;
        j--;
    }
    
    if (carry > 0) {
        result = carry + result;
    }
    
    return result;
}

/**
 * 辅助函数: 比较两个字符串表示的数字大小
 * @param {string} num1 - 数字1
 * @param {string} num2 - 数字2
 * @returns {number} 比较结果: -1(num1<num2), 0(num1=num2), 1(num1>num2)
 */
function compareStrings(num1, num2) {
    if (num1.length > num2.length) return 1;
    if (num1.length < num2.length) return -1;
    
    for (let i = 0; i < num1.length; i++) {
        if (num1[i] > num2[i]) return 1;
        if (num1[i] < num2[i]) return -1;
    }
    
    return 0;
}

// 导出函数
export {
    checkPoint,
    trimLeftZero,
    trimZero,
    displayValue,
    addStrings,
    compareStrings
}; 