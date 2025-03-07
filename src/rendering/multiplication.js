/**
 * Multiplication rendering module
 */

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
    
    // 设置绘图样式
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

export { renderMultiplication }; 