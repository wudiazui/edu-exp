/**
 * Division rendering module
 */

import { drawDivisionStruct } from './common.js';

/**
 * 渲染除法竖式
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {object} result - 除法计算结果
 * @param {object} options - 渲染选项
 */
function renderDivision(ctx, result, options) {
    const { dividend, divisor, quotient, steps } = result;
    const { fontSize } = options;
    
    // 设置绘图样式
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
    
    // 获取小数点位置，用于对齐
    const dot_pos1 = dividend.indexOf(".");
    const dot_pos2 = divisor.indexOf(".");
    
    // 计算起始位置，参考math_n.js中的计算方式
    let startX;
    
    // 根据小数点位置计算起始X坐标，参考math_n.js的方式
    if (dot_pos1 >= 0 || dot_pos2 >= 0) {
        // 如果有小数点，根据小数点位置计算
        if (dot_pos1 >= dot_pos2) {
            startX = dot_pos1 * gap + 4 * gap;
        } else {
            startX = dot_pos2 * gap + 4 * gap;
        }
        
        // 考虑小数点后的位数
        if (dot_pos1 >= 0 && dot_pos2 >= 0) {
            if (dividend.length - dot_pos1 >= divisor.length - dot_pos2) {
                startX += (dividend.length - dot_pos1) * gap;
            } else {
                startX += (divisor.length - dot_pos2) * gap;
            }
        } else if (dot_pos1 >= 0) {
            startX += (dividend.length - dot_pos1) * gap;
        } else if (dot_pos2 >= 0) {
            startX += (divisor.length - dot_pos2) * gap;
        }
    } else {
        // 如果没有小数点，使用默认计算方式
        startX = 50 + (divisor.length + 1) * gap;
    }
    
    // 确保最小起始位置
    if (startX < 6 * gap) {
        startX = 6 * gap;
    }
    
    let startY = options.isMobile ? 200 : 100;
    
    // 绘制除号结构
    // 首先绘制除数
    let x = startX - gap - 5;
    let y = startY + gap/2 + fontSize;
    
    // 存储除数和被除数的位置信息，用于后续步骤对齐
    let arrChushu = [];
    let arrBeiChushu = [];
    
    // 绘制除数，从右向左绘制
    for (let i = divisor.length - 1; i >= 0; i--) {
        const s = divisor[i];
        ctx.fillText(s, x, y);
        
        // 存储除数位置信息
        arrChushu.push({"X": x, "Y": y, "V": s, "visible": true});
        
        // 处理小数点位置
        if (s === ".") {
            x -= gap * 2/3;
        } else if (i > 0 && divisor[i-1] === ".") {
            x -= gap - gap * 2/3;
        } else {
            x -= gap;
        }
    }
    
    // 计算被除数的宽度，用于确定除号结构的宽度
    let dividendWidth = 0;
    for (let i = 0; i < dividend.length; i++) {
        if (dividend[i] === ".") {
            dividendWidth += gap * 2/3;
        } else if (i < dividend.length - 1 && dividend[i+1] === ".") {
            dividendWidth += gap - gap * 2/3;
        } else {
            dividendWidth += gap;
        }
    }
    
    // 绘制除号结构
    drawDivisionStruct(ctx, startX, startY, startX + dividendWidth + gap, fontSize);
    
    // 绘制被除数，在除号右侧
    x = startX;
    for (let i = 0; i < dividend.length; i++) {
        const s = dividend[i];
        ctx.fillText(s, x, y);
        
        // 存储被除数位置信息
        arrBeiChushu.push({"X": x, "Y": y, "V": s, "visible": true});
        
        // 处理小数点位置
        if (s === ".") {
            x += gap * 2/3;
        } else if (i < dividend.length - 1 && dividend[i+1] === ".") {
            x += gap - gap * 2/3;
        } else {
            x += gap;
        }
    }
    
    // 绘制商，在除号上方，采用右对齐方式
    let quotientY = startY - gap/2;
    let arrShang = []; // 存储商的位置信息
    
    // 计算商的起始位置，使其右对齐
    // 首先计算商的总宽度
    let quotientWidth = 0;
    for (let i = 0; i < quotient.length; i++) {
        if (quotient[i] === ".") {
            quotientWidth += gap * 2/3;
        } else if (i < quotient.length - 1 && quotient[i+1] === ".") {
            quotientWidth += gap - gap * 2/3;
        } else {
            quotientWidth += gap;
        }
    }
    
    // 计算商的起始X坐标，使其右对齐
    // 商的最后一位应该与被除数的最后一位对齐
    let quotientStartX = startX + dividendWidth - quotientWidth;
    
    // 确保商的起始位置不小于startX
    if (quotientStartX < startX) {
        quotientStartX = startX;
    }
    
    // 绘制商
    x = quotientStartX;
    for (let i = 0; i < quotient.length; i++) {
        const s = quotient[i];
        ctx.fillText(s, x, quotientY);
        
        // 存储商的位置信息
        arrShang.push({"X": x, "Y": quotientY, "V": s, "visible": true});
        
        // 处理小数点位置
        if (s === ".") {
            x += gap * 2/3;
        } else if (i < quotient.length - 1 && quotient[i+1] === ".") {
            x += gap - gap * 2/3;
        } else {
            x += gap;
        }
    }
    
    // 绘制计算步骤
    if (steps && steps.length > 0) {
        let currentY = y;
        let arrAmonRlt = []; // 存储计算步骤的位置信息
        
        // 处理每一步计算
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            
            // 确定当前步骤的位置
            // 对于第一步，位置应该在被除数的第一个数字下方
            // 对于后续步骤，位置应该根据前一步的余数和下一位被除数确定
            
            // 计算当前步骤的位置
            let stepX;
            
            if (i === 0) {
                // 第一步，位置在被除数的第一个数字下方
                stepX = startX;
            } else {
                // 后续步骤，位置根据前一步的余数确定
                // 在math_n.js中，每一步的位置是根据被除数的位置和当前处理的位数确定的
                // 这里我们简化处理，根据前一步的余数长度和当前步骤的位置确定
                
                // 获取前一步的余数
                const prevRemainder = steps[i-1].remainder;
                
                // 如果前一步的余数为0，则下一步应该右移一位
                if (prevRemainder === "0") {
                    stepX = arrBeiChushu[i].X;
                } else {
                    // 否则，根据余数的长度和被除数的位置确定
                    // 在math_n.js中，这部分逻辑比较复杂，这里我们简化处理
                    stepX = arrBeiChushu[i].X;
                }
            }
            
            // 绘制减数（当前商位 * 除数）
            const subtraction = step.subtraction;
            
            // 计算减数的宽度
            let subtractionWidth = subtraction.length * gap;
            
            // 确定减数的起始位置，使其最后一位与被减数的最后一位对齐
            // 如果是第一步，则与被除数的前几位对齐
            let subtractionStartX;
            
            if (i === 0) {
                // 第一步，减数的最后一位应该与被减数的第divisor.length位对齐
                // 例如：712 ÷ 8，第一步是计算71 ÷ 8，减数是64，应该与71对齐
                let minuendLength = divisor.length;
                if (parseInt(dividend.substring(0, minuendLength)) < parseInt(divisor)) {
                    // 如果被减数小于除数，则多取一位
                    minuendLength++;
                }
                // 减数的最后一位应该与被减数的最后一位对齐
                // 找到被减数的最后一位的位置
                let lastDigitIndex = minuendLength - 1;
                if (lastDigitIndex < arrBeiChushu.length) {
                    // 减数的最后一位应该与被减数的最后一位对齐
                    subtractionStartX = arrBeiChushu[lastDigitIndex].X - (subtraction.length - 1) * gap;
                } else {
                    // 如果超出被除数的长度，则使用最后一位的位置
                    subtractionStartX = arrBeiChushu[arrBeiChushu.length - 1].X - (subtraction.length - 1) * gap;
                }
            } else {
                // 后续步骤，减数的最后一位应该与当前处理的被除数位对齐
                // 例如：712 ÷ 8，第二步是计算72 ÷ 8，减数是72，应该与72对齐
                
                // 获取前一步的余数
                const prevRemainder = steps[i-1].remainder;
                
                // 计算当前步骤处理的被除数位的索引
                // 如果前一步的余数为0，则当前步骤处理的是下一位
                // 否则，当前步骤处理的是前一步余数加上下一位
                let currentDigitIndex;
                
                if (i === 1) {
                    // 第二步，索引应该是第一步处理的最后一位加1
                    let firstStepLastDigitIndex = divisor.length - 1;
                    if (parseInt(dividend.substring(0, divisor.length)) < parseInt(divisor)) {
                        firstStepLastDigitIndex++;
                    }
                    currentDigitIndex = firstStepLastDigitIndex + 1;
                } else {
                    // 后续步骤，索引应该是前一步处理的最后一位加1
                    currentDigitIndex = divisor.length + i - 1;
                }
                
                if (currentDigitIndex < arrBeiChushu.length) {
                    // 减数的最后一位应该与当前处理的被除数位对齐
                    subtractionStartX = arrBeiChushu[currentDigitIndex].X - (subtraction.length - 1) * gap;
                } else {
                    // 如果超出被除数的长度，则使用最后一位的位置
                    subtractionStartX = arrBeiChushu[arrBeiChushu.length - 1].X - (subtraction.length - 1) * gap;
                }
            }
            
            // 确保减数的起始位置不小于startX
            if (subtractionStartX < startX) {
                subtractionStartX = startX;
            }
            
            // 绘制减数
            x = subtractionStartX;
            for (let j = 0; j < subtraction.length; j++) {
                const s = subtraction[j];
                ctx.fillText(s, x, currentY + lineHeight);
                
                // 存储减数位置信息
                arrAmonRlt.push({"X": x, "Y": currentY + lineHeight, "V": s, "visible": true});
                
                x += gap;
            }
            
            // 绘制横线 - 与图片一致，只在减数下方绘制
            ctx.beginPath();
            ctx.moveTo(subtractionStartX, currentY + lineHeight + gap/4);
            ctx.lineTo(subtractionStartX + subtraction.length * gap, currentY + lineHeight + gap/4);
            ctx.stroke();
            
            // 绘制余数
            x = subtractionStartX;
            const remainder = step.remainder;
            
            for (let j = 0; j < remainder.length; j++) {
                const s = remainder[j];
                ctx.fillText(s, x, currentY + lineHeight * 2);
                
                // 存储余数位置信息
                arrAmonRlt.push({"X": x, "Y": currentY + lineHeight * 2, "V": s, "visible": true});
                
                x += gap;
            }
            
            // 更新Y坐标
            currentY += lineHeight * 2;
        }
    }
    
    ctx.restore();
}

export { renderDivision }; 