/**
 * Subtraction rendering module
 */

/**
 * 渲染减法竖式
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {object} result - 减法计算结果
 * @param {object} options - 渲染选项
 */
function renderSubtraction(ctx, result, options) {
    const { minuend, subtrahend, difference, borrows, isNegative } = result;
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
    
    // 计算整数部分的最大长度
    const integerLen1 = dot_pos1;
    const integerLen2 = dot_pos2;
    const maxIntegerLen = Math.max(integerLen1, integerLen2);
    
    // 计算小数部分的最大长度
    const decimalLen1 = dot_pos1 < gfactor1.length ? gfactor1.length - dot_pos1 - 1 : 0;
    const decimalLen2 = dot_pos2 < gfactor2.length ? gfactor2.length - dot_pos2 - 1 : 0;
    const maxDecimalLen = Math.max(decimalLen1, decimalLen2);
    
    // 计算差的小数点位置
    let diffDotPos = difference.indexOf('.');
    if (diffDotPos === -1) diffDotPos = difference.length;
    
    // 计算差的小数部分长度
    const diffDecimalLen = diffDotPos < difference.length ? difference.length - diffDotPos - 1 : 0;
    
    // 确保有足够的空间显示所有数字
    const totalWidth = (maxIntegerLen + maxDecimalLen + 2) * gap; // +2 for decimal point and extra space
    
    // 设置起始X坐标，确保小数点对齐
    let startX = options.width * 0.7;
    if (startX < totalWidth) {
        startX = totalWidth;
    }
    
    let startY = options.height * 0.3;
    if (!options.isMobile) {
        startY = 100;
    }
    
    const lineHeight = fontSize * 3/2;
    let x, y, i, s;
    
    ctx.beginPath();
    
    // 绘制被减数（第一个数）
    y = startY + gap/2 + fontSize;
    
    // 计算小数点的X坐标位置
    const dotX = startX - (maxDecimalLen + 1) * gap;
    
    // 绘制第一个数的整数部分（从右向左）
    x = dotX - gap;
    for (i = dot_pos1 - 1; i >= 0; i--) {
        s = gfactor1[i];
        ctx.fillText(s, x, y);
        x -= gap;
    }
    
    // 如果有小数点，绘制小数点
    if (dot_pos1 < gfactor1.length) {
        ctx.fillText(".", dotX, y);
        
        // 绘制小数部分（从左向右）
        x = dotX + gap;
        for (i = dot_pos1 + 1; i < gfactor1.length; i++) {
            s = gfactor1[i];
            ctx.fillText(s, x, y);
            x += gap;
        }
    }
    
    // 移动到下一行
    y += lineHeight;
    
    // 绘制减数（第二个数）
    // 绘制第二个数的整数部分（从右向左）
    x = dotX - gap;
    for (i = dot_pos2 - 1; i >= 0; i--) {
        s = gfactor2[i];
        ctx.fillText(s, x, y);
        x -= gap;
    }
    
    // 如果有小数点，绘制小数点
    if (dot_pos2 < gfactor2.length) {
        ctx.fillText(".", dotX, y);
        
        // 绘制小数部分（从左向右）
        x = dotX + gap;
        for (i = dot_pos2 + 1; i < gfactor2.length; i++) {
            s = gfactor2[i];
            ctx.fillText(s, x, y);
            x += gap;
        }
    }
    
    // 绘制减号
    x = dotX - (maxIntegerLen + 1) * gap;
    ctx.fillText("-", x, y);
    
    // 绘制横线
    let line_y = y + fontSize * 0.1;
    ctx.lineWidth = 1;
    ctx.moveTo(x - gap/2, line_y);
    
    // 计算横线的右端点
    let lineEndX = dotX;
    if (maxDecimalLen > 0) {
        lineEndX += (maxDecimalLen + 1) * gap;
    }
    
    ctx.lineTo(lineEndX, line_y);
    ctx.stroke();
    ctx.lineWidth = 2;
    
    // 移动到下一行绘制差
    y += lineHeight;
    
    // 处理差的显示
    let displayDiff = difference;
    if (neg) {
        // 如果结果为负，去掉负号（因为我们已经交换了被减数和减数）
        displayDiff = difference.startsWith('-') ? difference.substring(1) : difference;
    }
    
    // 获取差的小数点位置
    let diffDot = displayDiff.indexOf('.');
    if (diffDot === -1) diffDot = displayDiff.length;
    
    // 绘制差的整数部分（从右向左）
    x = dotX - gap;
    for (i = diffDot - 1; i >= 0; i--) {
        s = displayDiff[i];
        ctx.fillText(s, x, y);
        x -= gap;
    }
    
    // 如果有小数点，绘制小数点
    if (diffDot < displayDiff.length) {
        ctx.fillText(".", dotX, y);
        
        // 绘制小数部分（从左向右）
        x = dotX + gap;
        for (i = diffDot + 1; i < displayDiff.length; i++) {
            s = displayDiff[i];
            ctx.fillText(s, x, y);
            x += gap;
        }
    }
    
    // 如果结果为负，在最前面添加负号
    if (neg) {
        x = dotX - (diffDot + 1) * gap;
        ctx.fillText("-", x, y);
    }
    
    // 如果需要，绘制公式形式
    if (options.showFormula) {
        const formulaY = y + lineHeight * 1.5;
        let formulaX = x - gap * 2;
        
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
    }
    
    ctx.restore();
}

export { renderSubtraction }; 