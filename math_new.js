/**
 * 竖式计算库
 * 提供加减乘除四则运算的竖式计算功能
 */

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
    let s = Math.floor(res).toString(); // 只取整数部分
    
    // 模拟长除法计算步骤
    let steps = [];
    
    // 准备计算数据
    let dividend = parseInt(v1);
    let divisor = parseInt(v2);
    
    // 计算商和余数
    let quotient = Math.floor(dividend / divisor);
    let remainder = dividend % divisor;
    
    // 记录计算步骤
    steps.push({
        remainder: remainder.toString(),
        subtraction: (quotient * divisor).toString()
    });
    
    return {
        shang: s,
        steps: steps
    };
}

/**
 * 乘法竖式计算
 * @param {string} factor1 - 乘数1
 * @param {string} factor2 - 乘数2
 * @returns {object} 包含乘积与计算过程的对象
 */
function multiplicationVertical(factor1, factor2) {
    // 预处理输入
    factor1 = trimZero(factor1);
    factor2 = trimZero(factor2);
    
    // 计算乘法
    let result = calculateMultiplication(factor1, factor2);
    
    // 返回计算结果和过程
    return {
        factor1: factor1,
        factor2: factor2,
        product: result.product,
        steps: result.steps
    };
}

/**
 * 计算乘法
 * @param {string} factor1 - 乘数1
 * @param {string} factor2 - 乘数2
 * @returns {object} 包含乘积和计算步骤的对象
 */
function calculateMultiplication(factor1, factor2) {
    // 处理小数点
    let dot_pos1 = checkPoint(factor1, 0);
    let dot_pos2 = checkPoint(factor2, 0);
    
    // 计算小数点位置
    let decimal_places = 0;
    if (dot_pos1 != -1) {
        decimal_places += (factor1.length - dot_pos1 - 1);
    }
    if (dot_pos2 != -1) {
        decimal_places += (factor2.length - dot_pos2 - 1);
    }
    
    // 移除小数点进行计算
    let f1 = factor1.replace(".", "");
    let f2 = factor2.replace(".", "");
    
    // 计算步骤
    let steps = [];
    
    // 从右向左逐位计算
    for (let i = f2.length - 1; i >= 0; i--) {
        let digit = parseInt(f2[i]);
        let carry = 0;
        let partialProduct = "";
        
        // 计算当前位的部分积
        for (let j = f1.length - 1; j >= 0; j--) {
            let product = digit * parseInt(f1[j]) + carry;
            carry = Math.floor(product / 10);
            partialProduct = (product % 10) + partialProduct;
        }
        
        if (carry > 0) {
            partialProduct = carry + partialProduct;
        }
        
        // 根据位置添加末尾的零
        let position = f2.length - 1 - i;
        let displayProduct = partialProduct;
        
        // 只有当不是最低位时才添加零
        if (position > 0) {
            for (let k = 0; k < position; k++) {
                displayProduct += "0";
            }
        }
        
        // 处理部分积中的小数点
        if (decimal_places > 0) {
            let len = displayProduct.length;
            if (decimal_places >= len) {
                displayProduct = "0." + "0".repeat(decimal_places - len) + displayProduct;
            } else {
                displayProduct = displayProduct.substring(0, len - decimal_places) + "." + displayProduct.substring(len - decimal_places);
            }
        }
        
        // 记录步骤
        steps.push({
            multiplicand: factor1,
            multiplier_digit: f2[i],
            partial_product: displayProduct,
            position: position
        });
    }
    
    // 计算最终结果
    let product = "0";
    for (let i = 0; i < steps.length; i++) {
        // 对于加法，需要移除小数点再计算
        let partialWithoutDot = steps[i].partial_product.replace(".", "");
        product = addStrings(product, partialWithoutDot);
    }
    
    // 处理最终结果中的小数点
    if (decimal_places > 0) {
        let len = product.length;
        if (decimal_places >= len) {
            product = "0." + "0".repeat(decimal_places - len) + product;
        } else {
            product = product.substring(0, len - decimal_places) + "." + product.substring(len - decimal_places);
        }
    }
    
    return {
        product: trimZero(product),
        steps: steps
    };
}

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
 * 渲染竖式计算
 * @param {string} type - 计算类型：'addition', 'subtraction', 'multiplication', 'division'
 * @param {string[]} numbers - 参与计算的数字
 * @param {object} options - 渲染选项
 * @returns {HTMLCanvasElement} 包含竖式计算的Canvas元素
 */
function renderVerticalCalculation(type, numbers, options = {}) {
    // 默认选项
    const defaultOptions = {
        fontSize: 16,
        fontFamily: 'Times New Roman',
        color: '#000000',
        backgroundColor: '#FFFFFF',
        showSteps: true,
        width: 400,  // 增加默认宽度
        height: 400,  // 增加默认高度
        autoResize: true,
        isMobile: false
    };
    
    // 合并选项
    const renderOptions = { ...defaultOptions, ...options };
    
    // 创建Canvas元素
    const canvas = document.createElement('canvas');
    canvas.width = renderOptions.width;
    canvas.height = renderOptions.height;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = renderOptions.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 设置字体样式
    ctx.font = `${renderOptions.fontSize}pt ${renderOptions.fontFamily}`;
    ctx.fillStyle = renderOptions.color;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    // 根据计算类型执行不同的渲染
    let result;
    switch (type.toLowerCase()) {
        case 'addition':
            result = additionVertical(numbers[0], numbers[1]);
            renderAddition(ctx, result, renderOptions);
            break;
        case 'subtraction':
            result = subtractionVertical(numbers[0], numbers[1]);
            renderSubtraction(ctx, result, renderOptions);
            break;
        case 'multiplication':
            result = multiplicationVertical(numbers[0], numbers[1]);
            renderMultiplication(ctx, result, renderOptions);
            break;
        case 'division':
            result = divisionVertical(numbers[0], numbers[1]);
            renderDivision(ctx, result, renderOptions);
            break;
        default:
            ctx.textAlign = 'center';
            ctx.fillText('不支持的计算类型', canvas.width / 2, canvas.height / 2);
    }
    
    // 如果启用了自动调整大小，则调整Canvas大小
    if (renderOptions.autoResize && (renderOptions.width !== canvas.width || renderOptions.height !== canvas.height)) {
        // 直接返回已经调整过大小的canvas，不需要创建新的
        return canvas;
    }
    
    return canvas;
}

/**
 * 渲染加法竖式
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {object} result - 加法计算结果
 * @param {object} options - 渲染选项
 */
function renderAddition(ctx, result, options) {
    const { addend1, addend2, sum, carries } = result;
    const { fontSize } = options;
    
    // 设置绘图样式，与math_n.js保持一致
    ctx.save();
    ctx.fillStyle = options.color || '#000000';
    ctx.lineWidth = 2;
    ctx.font = `${fontSize}pt Times New Roman`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    
    // 清除画布
    ctx.clearRect(0, 0, options.width, options.height);
    
    // 处理小数点位置
    let dot_pos1 = addend1.indexOf('.');
    if (dot_pos1 === -1) dot_pos1 = addend1.length;
    
    let dot_pos2 = addend2.indexOf('.');
    if (dot_pos2 === -1) dot_pos2 = addend2.length;
    
    // 计算起始位置
    const gap = fontSize * 0.8; // 与math_n.js中的gap对应
    let startX;
    
    if (dot_pos1 >= dot_pos2) {
        startX = dot_pos1 * gap + 4 * gap;
    } else {
        startX = dot_pos2 * gap + 4 * gap;
    }
    
    if ((addend1.length - dot_pos1) >= (addend2.length - dot_pos2)) {
        startX += (addend1.length - dot_pos1) * gap;
    } else {
        startX += (addend2.length - dot_pos2) * gap;
    }
    
    if (startX < 6 * gap) {
        startX = 6 * gap;
    }
    
    let startY = options.height * 0.3;
    if (!options.isMobile) {
        startY = 100;
    }
    
    const lineHeight = fontSize * 3/2;
    let x, y, i, s;
    let maxLeft = startX - gap * 5;
    let maxRight = -1;
    
    ctx.beginPath();
    
    // 绘制顶部公式
    let kx = maxLeft;
    let ky = startY - gap;
    
    // 绘制第一个加数
    for (let k = 0; k < addend1.length; k++) {
        let ks = addend1[k];
        ctx.fillText(ks, kx, ky);
        
        if (k < addend1.length - 1 && addend1[k+1] === ".") {
            kx += gap * 2/3;
        } else if (addend1[k] === ".") {
            kx += gap - gap * 2/3;
        } else {
            kx += gap;
        }
    }
    
    // 绘制加号
    ctx.fillText("+", kx, ky);
    kx += gap;
    
    // 绘制第二个加数
    for (let k = 0; k < addend2.length; k++) {
        let ks = addend2[k];
        ctx.fillText(ks, kx, ky);
        
        if (k < addend2.length - 1 && addend2[k+1] === ".") {
            kx += gap * 2/3;
        } else if (addend2[k] === ".") {
            kx += gap - gap * 2/3;
        } else {
            kx += gap;
        }
    }
    
    // 绘制等号
    ctx.fillText("=", kx, ky);
    kx += gap;
    
    // 绘制结果
    for (let k = 0; k < sum.length; k++) {
        let ks = sum[k];
        ctx.fillText(ks, kx, ky);
        
        if (k < sum.length - 1 && sum[k+1] === ".") {
            kx += gap * 2/3;
        } else if (sum[k] === ".") {
            kx += gap - gap * 2/3;
        } else {
            kx += gap;
        }
    }
    
    if (maxRight < kx) {
        maxRight = kx;
    }
    
    // 绘制竖式
    x = startX - gap - 5;
    y = startY + gap/2 + fontSize;
    
    let dot_pos_x = x;
    
    // 绘制第一个加数
    let arrFactor1 = [];
    for (i = addend1.length - 1; i >= 0; i--) {
        s = addend1[i];
        ctx.fillText(s, x, y);
        
        if (s === ".") {
            dot_pos_x = x;
        }
        
        arrFactor1.push({"X": x, "Y": y, "V": s, "visible": true});
        
        if (s === ".") {
            x -= gap * 2/3;
        } else if (i >= 1 && addend1[i-1] === ".") {
            x -= gap - gap * 2/3;
        } else {
            x -= gap;
        }
    }
    
    if (x < maxLeft) {
        maxLeft = x;
    }
    
    // 重置x位置并增加y位置
    x = dot_pos_x;
    y += lineHeight;
    
    let start_p;
    if (dot_pos2 < addend2.length) {
        start_p = dot_pos2;
        
        if (dot_pos1 >= addend1.length) {
            x += gap * 2/3;
        }
    } else {
        start_p = addend2.length - 1;
        
        if (dot_pos1 < addend1.length) {
            x -= gap * 2/3;
        }
    }
    
    // 绘制第二个加数
    let arrFactor2 = [];
    for (i = start_p; i >= 0; i--) {
        s = addend2[i];
        ctx.fillText(s, x, y);
        
        arrFactor2.push({"X": x, "Y": y, "V": s, "visible": true});
        
        if (s === ".") {
            x -= gap * 2/3;
        } else if (i >= 1 && addend2[i-1] === ".") {
            x -= gap - gap * 2/3;
        } else {
            x -= gap;
        }
    }
    
    if (x < maxLeft) {
        maxLeft = x;
    }
    
    let prev_x = x;
    
    if (start_p === dot_pos2) {
        if (dot_pos1 >= addend1.length) {
            x = dot_pos_x + gap;
        } else {
            x = dot_pos_x + gap/3;
        }
        
        for (i = start_p + 1; i < addend2.length; i++) {
            s = addend2[i];
            ctx.fillText(s, x, y);
            
            arrFactor2.push({"X": x, "Y": y, "V": s, "visible": true});
            
            if (s === ".") {
                x += gap/3;
            } else if (i < addend2.length - 1 && addend2[i+1] === ".") {
                x += gap * 2/3;
            } else {
                x += gap;
            }
        }
    }
    
    if (maxRight < x) {
        maxRight = x;
    }
    
    // 绘制加号
    x = prev_x - gap;
    ctx.fillText("+", x, y);
    
    // 绘制横线
    ctx.beginPath();
    let lineY = y + fontSize * 0.05; // 横线位置靠近加数
    ctx.lineWidth = 1;
    
    // 找到最左侧的位置（包括加号）
    let leftMostX = x - gap * 0.8; // 加号位置左侧一点点
    
    // 计算结果的最右侧位置
    let resultRightX = startX - gap - 5 + gap * (sum.length + 0.3); // 结果右侧多一点点
    
    // 调整横线起点和终点，使其刚好超过数字宽度一点
    ctx.moveTo(leftMostX, lineY);
    ctx.lineTo(resultRightX, lineY);
    ctx.stroke();
    ctx.lineWidth = 2;
    
    // 绘制和
    y += lineHeight;
    
    // 找到最右侧的位置，确保与上方数字对齐
    x = startX - gap - 5;
    
    // 处理小数点对齐
    let a1 = addend1;
    let a2 = addend2;
    
    if (dot_pos1 !== -1 && dot_pos2 !== -1) {
        // 两个数都有小数点
        let decimal1 = addend1.length - dot_pos1 - 1;
        let decimal2 = addend2.length - dot_pos2 - 1;
        
        if (decimal1 < decimal2) {
            a1 = addend1 + "0".repeat(decimal2 - decimal1);
        } else if (decimal2 < decimal1) {
            a2 = addend2 + "0".repeat(decimal1 - decimal2);
        }
    } else if (dot_pos1 !== -1) {
        // 只有第一个数有小数点
        a2 = addend2 + "." + "0".repeat(addend1.length - dot_pos1 - 1);
    } else if (dot_pos2 !== -1) {
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
    
    // 绘制结果
    let arrResult = [];
    for (i = sum.length - 1; i >= 0; i--) {
        s = sum[i];
        ctx.fillText(s, x, y);
        
        arrResult.push({"X": x, "Y": y, "V": s, "visible": true});
        
        if (s === ".") {
            x -= gap * 2/3;
        } else if (i >= 1 && sum[i-1] === ".") {
            x -= gap - gap * 2/3;
        } else {
            x -= gap;
        }
    }
    
    // 绘制进位
    if (options.showSteps && carries.length > 0) {
        ctx.font = `${fontSize * 0.7}pt ${options.fontFamily}`;
        
        for (const carry of carries) {
            const pos = carry.position;
            // 找到对应位置的x坐标
            let xPos;
            
            if (pos < 0) {
                // 如果是最左侧的进位
                xPos = arrResult[0].X - gap;
            } else {
                // 找到对应位置的数字
                const digits = sum.length - 1 - pos;
                if (digits >= 0 && digits < arrResult.length) {
                    xPos = arrResult[digits].X;
                } else {
                    continue; // 跳过无效位置
                }
            }
            
            // 调整进位显示的位置，确保在数字上方
            const yPos = startY + gap/2 + fontSize + lineHeight - fontSize * 0.3;
            ctx.fillText(carry.value.toString(), xPos, yPos);
        }
        
        // 恢复字体
        ctx.font = `${fontSize}pt ${options.fontFamily}`;
    }
    
    // 调整画布大小以适应内容
    if (options.autoResize) {
        const newWidth = Math.max(maxRight, startX + gap * 5) + 3 * gap;
        const newHeight = y + 3 * gap;
        
        if (newWidth > options.width) {
            options.width = newWidth;
        }
        
        if (newHeight > options.height) {
            options.height = newHeight;
        }
    }
    
    ctx.restore();
}

/**
 * 渲染减法竖式
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {object} result - 减法计算结果
 * @param {object} options - 渲染选项
 */
function renderSubtraction(ctx, result, options) {
    const { minuend, subtrahend, difference, borrows, isNegative } = result;
    const { fontSize } = options;
    
    // 设置绘图样式，与math_n.js保持一致
    ctx.save();
    ctx.fillStyle = options.color || '#000000';
    ctx.lineWidth = 2;
    ctx.font = `${fontSize}pt Times New Roman`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    
    // 清除画布
    ctx.clearRect(0, 0, options.width, options.height);
    
    // 处理小数点位置
    let dot_pos1 = minuend.indexOf('.');
    if (dot_pos1 === -1) dot_pos1 = minuend.length;
    
    let dot_pos2 = subtrahend.indexOf('.');
    if (dot_pos2 === -1) dot_pos2 = subtrahend.length;
    
    // 使用传入的isNegative标志
    let neg = isNegative;
    let gfactor1 = neg ? subtrahend : minuend;
    let gfactor2 = neg ? minuend : subtrahend;
    
    // 重新计算小数点位置
    dot_pos1 = gfactor1.indexOf('.');
    if (dot_pos1 === -1) dot_pos1 = gfactor1.length;
    
    dot_pos2 = gfactor2.indexOf('.');
    if (dot_pos2 === -1) dot_pos2 = gfactor2.length;
    
    // 计算起始位置
    const gap = fontSize * 0.8; // 与math_n.js中的gap对应
    let startX;
    
    if (dot_pos1 >= dot_pos2) {
        startX = dot_pos1 * gap + 4 * gap;
    } else {
        startX = dot_pos2 * gap + 4 * gap;
    }
    
    if ((gfactor1.length - dot_pos1) >= (gfactor2.length - dot_pos2)) {
        startX += (gfactor1.length - dot_pos1) * gap;
    } else {
        startX += (gfactor2.length - dot_pos2) * gap;
    }
    
    if (startX < 6 * gap) {
        startX = 6 * gap;
    }
    
    let startY = options.height * 0.3;
    if (!options.isMobile) {
        startY = 100;
    }
    
    const lineHeight = fontSize * 3/2;
    let x, y, i, s;
    
    ctx.beginPath();
    
    x = startX - gap - 5;
    y = startY + gap/2 + fontSize;
    
    let dot_pos_x = x;
    
    // 绘制被减数
    let arrFactor1 = [];
    for (i = gfactor1.length - 1; i >= 0; i--) {
        s = gfactor1[i];
        ctx.fillText(s, x, y);
        
        if (s === ".") {
            dot_pos_x = x;
        }
        
        arrFactor1.push({"X": x, "Y": y, "V": s, "visible": true});
        
        if (s === ".") {
            x -= gap * 2/3;
        } else if (i >= 1 && gfactor1[i-1] === ".") {
            x -= gap - gap * 2/3;
        } else {
            x -= gap;
        }
    }
    
    let maxLeft = x;
    
    // 重置x位置并增加y位置
    x = dot_pos_x;
    y += lineHeight;
    
    let start_p;
    if (dot_pos2 < gfactor2.length) {
        start_p = dot_pos2;
        
        if (dot_pos1 >= gfactor1.length) {
            x += gap * 2/3;
        }
    } else {
        start_p = gfactor2.length - 1;
        
        if (dot_pos1 < gfactor1.length) {
            x -= gap * 2/3;
        }
    }
    
    // 绘制减数
    let arrFactor2 = [];
    for (i = start_p; i >= 0; i--) {
        s = gfactor2[i];
        ctx.fillText(s, x, y);
        
        arrFactor2.push({"X": x, "Y": y, "V": s, "visible": true});
        
        if (s === ".") {
            x -= gap * 2/3;
        } else if (i >= 1 && gfactor2[i-1] === ".") {
            x -= gap - gap * 2/3;
        } else {
            x -= gap;
        }
    }
    
    if (x < maxLeft) {
        maxLeft = x;
    }
    
    let prev_x = x;
    
    if (start_p === dot_pos2 && dot_pos2 < gfactor2.length - 1) {
        if (dot_pos1 >= gfactor1.length) {
            x = dot_pos_x + gap;
        } else {
            x = dot_pos_x + gap/3;
        }
        
        for (i = start_p + 1; i < gfactor2.length; i++) {
            s = gfactor2[i];
            ctx.fillText(s, x, y);
            
            arrFactor2.push({"X": x, "Y": y, "V": s, "visible": true});
            
            if (s === ".") {
                x += gap/3;
            } else if (i < gfactor2.length - 1 && gfactor2[i+1] === ".") {
                x += gap * 2/3;
            } else {
                x += gap;
            }
        }
    }
    
    let maxRight = x;
    
    // 绘制减号
    x = prev_x - gap;
    ctx.fillText("-", x, y);
    
    // 绘制横线
    let line_x = x - gap/2;
    let line_y = y - fontSize * 0.1; // 调整横线位置，让它稍微高一点
    ctx.lineWidth = 1;
    ctx.moveTo(line_x, line_y);
    
    line_x = startX;
    if (line_x < maxRight) {
        line_x = maxRight;
    }
    
    ctx.lineTo(line_x, line_y);
    ctx.stroke();
    ctx.lineWidth = 2;
    
    y += lineHeight;
    
    // 处理小数点对齐
    let a1 = gfactor1;
    let a2 = gfactor2;
    
    if (dot_pos1 !== -1 && dot_pos2 !== -1) {
        // 两个数都有小数点
        let decimal1 = gfactor1.length - dot_pos1 - 1;
        let decimal2 = gfactor2.length - dot_pos2 - 1;
        
        if (decimal1 < decimal2) {
            a1 = gfactor1 + "0".repeat(decimal2 - decimal1);
        } else if (decimal2 < decimal1) {
            a2 = gfactor2 + "0".repeat(decimal1 - decimal2);
        }
    } else if (dot_pos1 !== -1) {
        // 只有第一个数有小数点
        a2 = gfactor2 + "." + "0".repeat(gfactor1.length - dot_pos1 - 1);
    } else if (dot_pos2 !== -1) {
        // 只有第二个数有小数点
        a1 = gfactor1 + "." + "0".repeat(gfactor2.length - dot_pos2 - 1);
    }
    
    // 绘制差
    x = startX - gap - 5;
    let displayDiff = difference;
    if (neg) {
        // 如果结果为负，去掉负号（因为我们已经交换了被减数和减数）
        displayDiff = difference.startsWith('-') ? difference.substring(1) : difference;
    }
    
    for (i = displayDiff.length - 1; i >= 0; i--) {
        s = displayDiff[i];
        ctx.fillText(s, x, y);
        
        if (s === ".") {
            x -= gap * 2/3;
        } else if (i >= 1 && displayDiff[i-1] === ".") {
            x -= gap - gap * 2/3;
        } else {
            x -= gap;
        }
    }
    
    // 如果结果为负，在最前面添加负号
    if (neg) {
        x -= gap;
        ctx.fillText("-", x, y);
    }
    
    // 绘制借位
    if (options.showSteps && borrows.length > 0) {
        ctx.font = `${fontSize * 0.7}pt ${options.fontFamily || 'Times New Roman'}`;
        
        for (const borrow of borrows) {
            const pos = borrow.position;
            if (pos >= 0) {  // 确保位置有效
                const xPos = startX - (pos + 1) * gap - 5;
                const yPos = startY + gap/2;
                ctx.fillText("1", xPos, yPos);
            }
        }
        ctx.font = `${fontSize}pt ${options.fontFamily || 'Times New Roman'}`;
    }
    
    // 如果需要，绘制公式形式
    if (options.showFormula) {
        const formulaY = y + lineHeight * 1.5;
        let formulaX = maxLeft;
        
        // 绘制公式: minuend - subtrahend = difference
        for (i = 0; i < gfactor1.length; i++) {
            s = gfactor1[i];
            ctx.fillText(s, formulaX, formulaY);
            
            if (i < gfactor1.length - 1 && gfactor1[i+1] === ".") {
                formulaX += gap * 2/3;
            } else if (s === ".") {
                formulaX += gap - gap * 2/3;
            } else {
                formulaX += gap;
            }
        }
        
        ctx.fillText("-", formulaX, formulaY);
        formulaX += gap;
        
        for (i = 0; i < gfactor2.length; i++) {
            s = gfactor2[i];
            ctx.fillText(s, formulaX, formulaY);
            
            if (i < gfactor2.length - 1 && gfactor2[i+1] === ".") {
                formulaX += gap * 2/3;
            } else if (s === ".") {
                formulaX += gap - gap * 2/3;
            } else {
                formulaX += gap;
            }
        }
        
        ctx.fillText("=", formulaX, formulaY);
        formulaX += gap;
        
        if (!options.hideResult) {
            const resultToShow = neg ? "-" + displayDiff : displayDiff;
            for (i = 0; i < resultToShow.length; i++) {
                s = resultToShow[i];
                ctx.fillText(s, formulaX, formulaY);
                
                if (i < resultToShow.length - 1 && resultToShow[i+1] === ".") {
                    formulaX += gap * 2/3;
                } else if (s === ".") {
                    formulaX += gap - gap * 2/3;
                } else {
                    formulaX += gap;
                }
            }
        }
        
        if (formulaX > maxRight) {
            maxRight = formulaX;
        }
    }
    
    ctx.restore();
}

/**
 * 渲染乘法竖式
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {object} result - 乘法计算结果
 * @param {object} options - 渲染选项
 */
function renderMultiplication(ctx, result, options) {
    const { factor1, factor2, product, steps } = result;
    // 合并默认选项
    options = {
        fontSize: 16,
        width: 400,
        height: 300,
        color: '#000000',
        showSteps: true,
        isMobile: false,
        autoResize: true,
        ...options
    };
    
    const { fontSize } = options;
    
    // 设置绘图样式，与math_n.js保持一致
    ctx.save();
    ctx.fillStyle = options.color || '#000000';
    ctx.lineWidth = 2;
    ctx.font = `${fontSize}pt Times New Roman`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    
    // 清除画布
    ctx.clearRect(0, 0, options.width, options.height);
    
    // 计算起始位置
    const gap = fontSize * 0.8; // 与math_n.js中的gap对应
    let startX = (factor1.length + factor2.length) * gap + 4 * gap;
    if (startX < 6 * gap) {
        startX = 6 * gap;
    }
    
    // 增加起始Y位置，确保有足够空间显示
    let startY = options.height * 0.1;
    if (!options.isMobile) {
        startY = 60;
    }
    
    // 查找第一个和最后一个非零数字
    let lastNonZero1, lastNonZero2;
    let firstNonZero1, firstNonZero2;
    
    for (lastNonZero1 = factor1.length - 1; lastNonZero1 >= 0; lastNonZero1--) {
        if (factor1[lastNonZero1] !== '0' && factor1[lastNonZero1] !== '.') {
            break;
        }
    }
    
    for (lastNonZero2 = factor2.length - 1; lastNonZero2 >= 0; lastNonZero2--) {
        if (factor2[lastNonZero2] !== '0' && factor2[lastNonZero2] !== '.') {
            break;
        }
    }
    
    for (firstNonZero1 = 0; firstNonZero1 < factor1.length; firstNonZero1++) {
        if (factor1[firstNonZero1] !== '0' && factor1[firstNonZero1] !== '.') {
            break;
        }
    }
    
    for (firstNonZero2 = 0; firstNonZero2 < factor2.length; firstNonZero2++) {
        if (factor2[firstNonZero2] !== '0' && factor2[firstNonZero2] !== '.') {
            break;
        }
    }
    
    // 增加行高，使内容更加分散
    const lineHeight = fontSize * 2;
    let x, y, i, s;
    let nonZero_x = 0;
    let line_y;
    let maxRight = -1;
    
    // 跟踪最左侧和最右侧的数字位置
    let leftMostX = Infinity;
    let rightMostX = -Infinity;
    
    ctx.beginPath();
    
    // 调整起始X位置，确保有足够空间显示
    x = startX - gap - 5;
    y = startY + gap/2 + fontSize;
    
    // 绘制第一个因数
    let arrFactor1 = [];
    for (i = factor1.length - 1; i >= 0; i--) {
        s = factor1[i];
        ctx.fillText(s, x, y);
        
        // 跟踪最左侧和最右侧的位置
        leftMostX = Math.min(leftMostX, x - gap/2);
        rightMostX = Math.max(rightMostX, x + gap/2);
        
        if (s !== "0" && s !== "." && nonZero_x <= 0) {
            nonZero_x = x;
        }
        
        arrFactor1.push({"X": x, "Y": y, "V": s, "visible": true});
        
        if (s === ".") {
            x -= gap * 2/3;
        } else if (i >= 1 && factor1[i-1] === ".") {
            x -= gap - gap * 2/3;
        } else {
            x -= gap;
        }
    }
    
    y += lineHeight;
    
    // 重置x位置
    if (nonZero_x > 0) {
        x = nonZero_x;
    } else {
        x = startX - gap - 5;
    }
    
    // 绘制第二个因数
    let arrFactor2 = [];
    let arrPos = new Array(factor2.length);
    for (i = 0; i < arrPos.length; i++) {
        arrPos[i] = -1;
    }
    
    let lastNonZero2startPos = lastNonZero2;
    if (lastNonZero2startPos < 0) {
        lastNonZero2startPos = 0;
    }
    
    for (i = factor2.length - 1; i >= 0; i--) {
        s = factor2[i];
        ctx.fillText(s, x, y);
        
        // 跟踪最左侧和最右侧的位置
        leftMostX = Math.min(leftMostX, x - gap/2);
        rightMostX = Math.max(rightMostX, x + gap/2);
        
        arrFactor2.push({"X": x, "Y": y, "V": s, "visible": true});
        arrPos[i] = x;
        
        if (s === ".") {
            x -= gap * 2/3;
        } else if (i >= 1 && factor2[i-1] === ".") {
            x -= gap - gap * 2/3;
        } else {
            x -= gap;
        }
    }
    
    // 绘制乘号
    x -= gap;
    ctx.fillText("×", x, y);
    
    // 跟踪乘号的位置
    leftMostX = Math.min(leftMostX, x - gap/2);
    
    // 绘制第一条横线 - 在乘数下方
    line_y = y + fontSize * 0.2;
    
    // 预先计算部分积和最终结果的位置
    if (options.showSteps && steps && steps.length > 0) {
        for (i = 0; i < steps.length; i++) {
            const partial = steps[i].partial_product;
            let tempX = startX - gap - 5;
            
            for (let j = partial.length - 1; j >= 0; j--) {
                // 跟踪最左侧和最右侧的位置
                leftMostX = Math.min(leftMostX, tempX - gap/2);
                rightMostX = Math.max(rightMostX, tempX + gap/2);
                
                if (partial[j] === ".") {
                    tempX -= gap * 2/3;
                } else if (j >= 1 && partial[j-1] === ".") {
                    tempX -= gap - gap * 2/3;
                } else {
                    tempX -= gap;
                }
            }
        }
    }
    
    // 检查最终结果的位置
    let tempX = startX - gap - 5;
    for (i = product.length - 1; i >= 0; i--) {
        // 跟踪最左侧和最右侧的位置
        leftMostX = Math.min(leftMostX, tempX - gap/2);
        rightMostX = Math.max(rightMostX, tempX + gap/2);
        
        if (product[i] === ".") {
            tempX -= gap * 2/3;
        } else if (i >= 1 && product[i-1] === ".") {
            tempX -= gap - gap * 2/3;
        } else {
            tempX -= gap;
        }
    }
    
    // 添加适当的边距，右侧多一些
    leftMostX -= gap/2;
    rightMostX += gap * 2; // 右侧多出来一些，看起来更顺眼
    
    // 绘制第一条横线
    ctx.beginPath();
    ctx.moveTo(rightMostX, line_y);
    ctx.lineTo(leftMostX, line_y);
    ctx.stroke();
    
    if (maxRight < rightMostX) {
        maxRight = rightMostX;
    }
    
    y += lineHeight;
    
    // 绘制部分积
    let lastPartialY = y;
    let skipFinalResult = false;
    
    if (options.showSteps && steps && steps.length > 0) {
        let arrPartialProducts = [];
        
        // 检查是否只有一个部分积且与最终结果相同（考虑小数点）
        if (steps.length === 1) {
            // 移除小数点后比较
            let partialWithoutDot = steps[0].partial_product.replace(".", "");
            let productWithoutDot = product.replace(".", "");
            
            if (partialWithoutDot === productWithoutDot) {
                skipFinalResult = true;
            }
        }
        
        // 从右向左逐位绘制部分积
        for (i = 0; i < steps.length; i++) {
            const step = steps[i];
            const partial = step.partial_product;
            const position = step.position || 0;
            
            // 从右向左绘制部分积，确保数字对齐
            x = startX - gap - 5;
            
            for (let j = partial.length - 1; j >= 0; j--) {
                s = partial[j];
                ctx.fillText(s, x, y);
                
                arrPartialProducts.push({"X": x, "Y": y, "V": s, "visible": true});
                
                if (s === ".") {
                    x -= gap * 2/3;
                } else if (j >= 1 && partial[j-1] === ".") {
                    x -= gap - gap * 2/3;
                } else {
                    x -= gap;
                }
            }
            
            lastPartialY = y;
            y += lineHeight;
        }
        
        // 如果有多个部分积，绘制第二条横线 - 在部分积之后
        if (steps.length > 1) {
            ctx.beginPath();
            // 调整横线位置，使其在最后一个部分积下方
            line_y = lastPartialY + fontSize * 0.2;
            
            ctx.moveTo(rightMostX, line_y);
            ctx.lineTo(leftMostX, line_y);
            ctx.stroke();
        }
    }
    
    // 绘制最终结果，但如果只有一个部分积且与最终结果相同，则跳过
    if (!skipFinalResult) {
        x = startX - gap - 5;
        for (i = product.length - 1; i >= 0; i--) {
            s = product[i];
            ctx.fillText(s, x, y);
            
            if (s === ".") {
                x -= gap * 2/3;
            } else if (i >= 1 && product[i-1] === ".") {
                x -= gap - gap * 2/3;
            } else {
                x -= gap;
            }
        }
    }
    
    // 确保画布大小足够显示所有内容
    if (options.autoResize && ctx.canvas) {
        const padding = gap * 6; // 增加内边距
        const newWidth = Math.max(maxRight + padding, startX + padding);
        const newHeight = y + lineHeight + padding;
        
        // 只有当画布尺寸不足时才调整
        if (ctx.canvas.width < newWidth || ctx.canvas.height < newHeight) {
            ctx.canvas.width = newWidth;
            ctx.canvas.height = newHeight;
            
            // 重新绘制内容
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            renderMultiplication(ctx, result, {...options, autoResize: false});
            return;
        }
    }
    
    ctx.restore();
}

/**
 * 渲染除法竖式
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {object} result - 除法计算结果
 * @param {object} options - 渲染选项
 */
function renderDivision(ctx, result, options) {
    const { dividend, divisor, quotient, steps } = result;
    const { fontSize } = options;
    
    // 设置绘图样式，与math_n.js保持一致
    ctx.save();
    ctx.fillStyle = options.color || '#000000';
    ctx.lineWidth = 2;
    ctx.font = `${fontSize}pt Times New Roman`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    
    // 清除画布
    ctx.clearRect(0, 0, options.width, options.height);
    
    // 检查除数是否为0
    if (parseFloat(divisor) === 0) {
        ctx.textAlign = "center";
        ctx.fillText("除数为0！", options.width / 2, options.height / 2);
        ctx.restore();
        return;
    }
    
    // 检查是否为整数除法
    const isZhengshu = dividend.indexOf(".") < 0 && divisor.indexOf(".") < 0;
    
    // 计算起始位置
    const gap = fontSize * 0.8; // 与math_n.js中的gap对应
    const lineHeight = fontSize * 1.5; // 与math_n.js中的lineHeight对应
    
    // 计算起始位置，参考math_n.js中的计算方式
    let startX = 50 + (divisor.length + 1) * gap;
    let startY = options.isMobile ? 200 : 100;
    
    // 绘制除号结构
    // 首先绘制除数
    let x = startX - gap - 5;
    let y = startY + gap/2 + fontSize;
    
    // 绘制除数，从右向左绘制
    for (let i = divisor.length - 1; i >= 0; i--) {
        const s = divisor[i];
        ctx.fillText(s, x, y);
        
        // 处理小数点位置
        if (s === ".") {
            x -= gap * 2/3;
        } else if (i > 0 && divisor[i-1] === ".") {
            x -= gap - gap * 2/3;
        } else {
            x -= gap;
        }
    }
    
    // 绘制除号结构 - 调整为与图片一致的样式
    drawDivisionStruct(ctx, startX, startY, startX + Math.max(dividend.length, quotient.length) * gap + gap, fontSize);
    
    // 绘制被除数，在除号右侧
    x = startX;
    for (let i = 0; i < dividend.length; i++) {
        const s = dividend[i];
        ctx.fillText(s, x, y);
        
        // 处理小数点位置
        if (s === ".") {
            x += gap * 2/3;
        } else if (i < dividend.length - 1 && dividend[i+1] === ".") {
            x += gap - gap * 2/3;
        } else {
            x += gap;
        }
    }
    
    // 绘制商，在除号上方
    x = startX;
    let quotientY = y - gap - fontSize/2;
    
    // 绘制商
    for (let i = 0; i < quotient.length; i++) {
        const s = quotient[i];
        ctx.fillText(s, x, quotientY);
        x += gap;
    }
    
    // 绘制计算步骤
    if (steps.length > 0) {
        let currentY = y;
        
        // 处理每一步计算
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            
            // 绘制减数
            x = startX;
            const subtraction = step.subtraction;
            
            // 对齐被除数
            let padding = dividend.length - subtraction.length;
            if (padding > 0) {
                x += padding * gap;
            }
            
            for (let j = 0; j < subtraction.length; j++) {
                const s = subtraction[j];
                ctx.fillText(s, x, currentY + lineHeight);
                x += gap;
            }
            
            // 绘制横线 - 调整位置使其与图片一致
            ctx.beginPath();
            ctx.moveTo(startX, currentY + lineHeight + gap/4);
            ctx.lineTo(startX + dividend.length * gap, currentY + lineHeight + gap/4);
            ctx.stroke();
            
            // 绘制余数
            x = startX;
            const remainder = step.remainder;
            
            // 对齐被除数
            padding = dividend.length - remainder.length;
            if (padding > 0) {
                x += padding * gap;
            }
            
            for (let j = 0; j < remainder.length; j++) {
                const s = remainder[j];
                ctx.fillText(s, x, currentY + lineHeight * 2);
                x += gap;
            }
            
            // 更新Y坐标
            currentY += lineHeight * 2;
        }
    }
    
    ctx.restore();
}

/**
 * 绘制除法结构
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {number} startX - 起始X坐标
 * @param {number} startY - 起始Y坐标
 * @param {number} endX - 结束X坐标
 * @param {number} fontSize - 字体大小
 */
function drawDivisionStruct(ctx, startX, startY, endX, fontSize) {
    ctx.beginPath();
    
    // 保存当前线宽
    const w = ctx.lineWidth;
    ctx.lineWidth = 2;
    
    // 绘制横线 - 调整位置使其与图片一致
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, startY);
    
    // 绘制左侧弧线 - 调整为与图片一致的样式
    ctx.moveTo(startX, startY);
    const r = fontSize * 2.5;
    ctx.arc(startX - r, startY, r, 0, 0.5 * Math.PI);
    
    // 恢复线宽
    ctx.lineWidth = w;
    ctx.stroke();
}

/**
 * 将竖式计算插入到DOM元素中
 * @param {string} expression - 计算表达式或计算类型
 * @param {string|HTMLElement} target - 目标DOM元素或其ID
 * @param {object} options - 渲染选项
 * @returns {HTMLCanvasElement} 插入的Canvas元素
 */
function insertVerticalCalculationImage(expression, target, options = {}) {
    // 解析表达式
    let type, numbers;
    
    if (Array.isArray(expression)) {
        // 如果是数组，假设第一个元素是类型，其余是数字
        type = expression[0];
        numbers = expression.slice(1);
    } else if (typeof expression === 'string') {
        // 解析表达式字符串
        const result = parseExpression(expression);
        type = result.type;
        numbers = result.numbers;
        
        // 为乘法和除法提供更大的默认尺寸
        if (type === 'multiplication' || type === 'division') {
            options.width = options.width || 500;
            options.height = options.height || 500;
        }
        
        // 处理无效表达式
        if (type === 'invalid') {
            const canvas = document.createElement('canvas');
            canvas.width = options.width || 300;
            canvas.height = options.height || 200;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = options.backgroundColor || '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = `${options.fontSize || 16}pt ${options.fontFamily || 'Times New Roman'}`;
            ctx.fillStyle = options.color || '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(result.message, canvas.width / 2, canvas.height / 2);
            
            // 获取目标元素
            const targetElement = typeof target === 'string' ? document.getElementById(target) : target;
            
            // 清空目标元素
            if (targetElement) {
                while (targetElement.firstChild) {
                    targetElement.removeChild(targetElement.firstChild);
                }
                
                // 插入Canvas
                targetElement.appendChild(canvas);
            }
            
            return canvas;
        }
    } else {
        throw new Error('不支持的表达式格式');
    }
    
    // 渲染竖式计算
    const canvas = renderVerticalCalculation(type, numbers, options);
    
    // 获取目标元素
    const targetElement = typeof target === 'string' ? document.getElementById(target) : target;
    
    // 清空目标元素
    if (targetElement) {
        while (targetElement.firstChild) {
            targetElement.removeChild(targetElement.firstChild);
        }
        
        // 插入Canvas
        targetElement.appendChild(canvas);
    }
    
    return canvas;
}

/**
 * 解析计算表达式
 * @param {string} expression - 计算表达式
 * @returns {object} 包含计算类型和数字的对象
 */
function parseExpression(expression) {
    // 去除所有空格
    expression = expression.replace(/\s+/g, '');
    
    // 检查是否包含加号
    if (expression.includes('+')) {
        // 找到第一个不是在括号内的加号
        let bracketCount = 0;
        let operatorIndex = -1;
        
        for (let i = 0; i < expression.length; i++) {
            if (expression[i] === '(') bracketCount++;
            else if (expression[i] === ')') bracketCount--;
            else if (expression[i] === '+' && bracketCount === 0) {
                operatorIndex = i;
                break;
            }
        }
        
        if (operatorIndex !== -1) {
            const addend1 = expression.substring(0, operatorIndex).trim();
            const addend2 = expression.substring(operatorIndex + 1).trim();
            
            // 处理括号
            const cleanAddend1 = addend1.replace(/^\(|\)$/g, '');
            const cleanAddend2 = addend2.replace(/^\(|\)$/g, '');
            
            return { type: 'addition', numbers: [cleanAddend1, cleanAddend2] };
        }
    }
    
    // 检查是否包含减号（注意负数的情况）
    if (expression.includes('-')) {
        // 找到第一个不是开头且不在括号内的减号
        let bracketCount = 0;
        let operatorIndex = -1;
        
        for (let i = 1; i < expression.length; i++) {
            if (expression[i] === '(') bracketCount++;
            else if (expression[i] === ')') bracketCount--;
            else if (expression[i] === '-' && bracketCount === 0 && 
                    !(i > 0 && (expression[i-1] === 'e' || expression[i-1] === 'E'))) {
                operatorIndex = i;
                break;
            }
        }
        
        if (operatorIndex !== -1) {
            const minuend = expression.substring(0, operatorIndex).trim();
            const subtrahend = expression.substring(operatorIndex + 1).trim();
            
            // 处理括号
            const cleanMinuend = minuend.replace(/^\(|\)$/g, '');
            const cleanSubtrahend = subtrahend.replace(/^\(|\)$/g, '');
            
            return { type: 'subtraction', numbers: [cleanMinuend, cleanSubtrahend] };
        } else if (expression.startsWith('-')) {
            // 如果只有一个减号且在开头，这是一个负数，不是减法表达式
            return { type: 'invalid', message: '无效的表达式，只有一个负数' };
        }
    }
    
    // 检查是否包含乘号
    if (expression.includes('*') || expression.includes('×')) {
        const separator = expression.includes('*') ? '*' : '×';
        
        // 找到第一个不在括号内的乘号
        let bracketCount = 0;
        let operatorIndex = -1;
        
        for (let i = 0; i < expression.length; i++) {
            if (expression[i] === '(') bracketCount++;
            else if (expression[i] === ')') bracketCount--;
            else if (expression[i] === separator && bracketCount === 0) {
                operatorIndex = i;
                break;
            }
        }
        
        if (operatorIndex !== -1) {
            const factor1 = expression.substring(0, operatorIndex).trim();
            const factor2 = expression.substring(operatorIndex + 1).trim();
            
            // 处理括号
            const cleanFactor1 = factor1.replace(/^\(|\)$/g, '');
            const cleanFactor2 = factor2.replace(/^\(|\)$/g, '');
            
            return { type: 'multiplication', numbers: [cleanFactor1, cleanFactor2] };
        }
    }
    
    // 检查是否包含除号
    if (expression.includes('/') || expression.includes('÷')) {
        const separator = expression.includes('/') ? '/' : '÷';
        
        // 找到第一个不在括号内的除号
        let bracketCount = 0;
        let operatorIndex = -1;
        
        for (let i = 0; i < expression.length; i++) {
            if (expression[i] === '(') bracketCount++;
            else if (expression[i] === ')') bracketCount--;
            else if (expression[i] === separator && bracketCount === 0) {
                operatorIndex = i;
                break;
            }
        }
        
        if (operatorIndex !== -1) {
            const dividend = expression.substring(0, operatorIndex).trim();
            const divisor = expression.substring(operatorIndex + 1).trim();
            
            // 处理括号
            const cleanDividend = dividend.replace(/^\(|\)$/g, '');
            const cleanDivisor = divisor.replace(/^\(|\)$/g, '');
            
            return { type: 'division', numbers: [cleanDividend, cleanDivisor] };
        }
    }
    
    // 如果没有找到有效的运算符，检查是否是单个数字
    if (/^-?\d*\.?\d+$/.test(expression)) {
        return { type: 'invalid', message: '表达式必须包含运算符' };
    }
    
    return { type: 'invalid', message: '无效的表达式' };
}

// 导出函数，使用ES6模块语法
export {
    divisionVertical,
    multiplicationVertical,
    additionVertical,
    subtractionVertical,
    displayValue,
    trimZero,
    renderVerticalCalculation,
    insertVerticalCalculationImage,
    parseExpression
}; 