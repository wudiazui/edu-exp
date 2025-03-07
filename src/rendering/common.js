/**
 * Common rendering functions
 */

// 导入渲染函数
import { renderAddition } from './addition.js';
import { renderSubtraction } from './subtraction.js';
import { renderMultiplication } from './multiplication.js';
import { renderDivision } from './division.js';

// 导入计算函数
import { additionVertical } from '../operations/addition.js';
import { subtractionVertical } from '../operations/subtraction.js';
import { multiplicationVertical } from '../operations/multiplication.js';
import { divisionVertical } from '../operations/division.js';

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
        width: 180,  // 减小默认宽度
        height: 150,  // 减小默认高度
        padding: 10,  // 减小默认内边距，原来是20
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
        // 创建一个新的Canvas，大小与调整后的尺寸一致
        const newCanvas = document.createElement('canvas');
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        
        // 获取新Canvas的上下文
        const newCtx = newCanvas.getContext('2d');
        
        // 设置背景色
        newCtx.fillStyle = renderOptions.backgroundColor;
        newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height);
        
        // 将原Canvas的内容复制到新Canvas
        newCtx.drawImage(canvas, 0, 0);
        
        return newCanvas;
    }
    
    return canvas;
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
    ctx.lineWidth = 2; // 减小线宽，原来是3
    
    // 绘制横线 - 完全按照math_n.js的方式
    ctx.moveTo(startX - 1, startY);
    ctx.lineTo(endX, startY);
    
    // 绘制左侧弧线 - 减小弧线半径使其更紧凑
    ctx.moveTo(startX, startY);
    const r = fontSize * 2.5; // 减小半径，原来是3
    ctx.arc(startX - r, startY, r, 0.05 * Math.PI, 0.25 * Math.PI); // 使用与math_n.js完全相同的角度
    
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

export {
    renderVerticalCalculation,
    drawDivisionStruct,
    insertVerticalCalculationImage,
    parseExpression
}; 