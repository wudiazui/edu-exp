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

export { renderSubtraction }; 