/**
 * Addition rendering module
 */

/**
 * 渲染加法竖式
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {object} result - 加法计算结果
 * @param {object} options - 渲染选项
 */
function renderAddition(ctx, result, options) {
    let { addend1, addend2, sum, carries } = result;
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
    let dot_pos1 = addend1.indexOf('.');
    if (dot_pos1 === -1) dot_pos1 = addend1.length;
    
    let dot_pos2 = addend2.indexOf('.');
    if (dot_pos2 === -1) dot_pos2 = addend2.length;
    
    // 确保sum中有小数点，如果原始数据有小数点
    if (sum.indexOf('.') === -1 && (dot_pos1 < addend1.length || dot_pos2 < addend2.length)) {
        // 如果加数中有小数点但结果没有，需要添加小数点
        // 计算小数点应该在结果中的位置
        let decimalPlaces1 = dot_pos1 < addend1.length ? addend1.length - dot_pos1 - 1 : 0;
        let decimalPlaces2 = dot_pos2 < addend2.length ? addend2.length - dot_pos2 - 1 : 0;
        let maxDecimalPlaces = Math.max(decimalPlaces1, decimalPlaces2);
        
        if (maxDecimalPlaces > 0) {
            // 在结果中插入小数点
            sum = sum.slice(0, sum.length - maxDecimalPlaces) + '.' + sum.slice(sum.length - maxDecimalPlaces);
        }
    }
    
    let dot_pos_sum = sum.indexOf('.');
    if (dot_pos_sum === -1) dot_pos_sum = sum.length;
    
    // 计算起始位置 - 调整数字间距
    const gap = fontSize * 0.65; // 减小间距，原来是0.8
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
            x -= gap * 0.5; // 调整小数点后的间距，原来是2/3
        } else if (i >= 1 && addend1[i-1] === ".") {
            x -= gap - gap * 0.5; // 调整小数点前的间距，原来是2/3
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
            x += gap * 0.5; // 调整小数点间距，原来是2/3
        }
    } else {
        start_p = addend2.length - 1;
        
        if (dot_pos1 < addend1.length) {
            x -= gap * 0.5; // 调整小数点间距，原来是2/3
        }
    }
    
    // 绘制第二个加数
    let arrFactor2 = [];
    for (i = start_p; i >= 0; i--) {
        s = addend2[i];
        ctx.fillText(s, x, y);
        
        arrFactor2.push({"X": x, "Y": y, "V": s, "visible": true});
        
        if (s === ".") {
            x -= gap * 0.5; // 调整小数点后的间距，原来是2/3
        } else if (i >= 1 && addend2[i-1] === ".") {
            x -= gap - gap * 0.5; // 调整小数点前的间距，原来是2/3
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
            x = dot_pos_x + gap * 0.3; // 调整小数点后的间距，原来是1/3
        }
        
        for (i = start_p + 1; i < addend2.length; i++) {
            s = addend2[i];
            ctx.fillText(s, x, y);
            
            arrFactor2.push({"X": x, "Y": y, "V": s, "visible": true});
            
            if (s === ".") {
                x += gap * 0.3; // 调整小数点间距，原来是1/3
            } else if (i < addend2.length - 1 && addend2[i+1] === ".") {
                x += gap * 0.5; // 调整小数点前的间距，原来是2/3
            } else {
                x += gap;
            }
        }
    }
    
    if (maxRight < x) {
        maxRight = x;
    }
    
    // 绘制加号
    x = prev_x - gap * 0.9; // 调整加号位置，使其更靠近数字，原来是gap
    ctx.fillText("+", x, y);
    
    // 绘制横线
    ctx.beginPath();
    let lineY = y + fontSize * 0.05; // 横线位置靠近加数
    ctx.lineWidth = 1;
    
    // 找到最左侧的位置（包括加号）
    let leftMostX = x - gap * 0.7; // 加号位置左侧一点点，原来是0.8
    
    // 计算结果的最右侧位置
    let resultRightX = startX - gap - 5 + gap * (sum.length + 0.2); // 结果右侧多一点点，原来是0.3
    
    // 调整横线起点和终点，使其刚好超过数字宽度一点
    ctx.moveTo(leftMostX, lineY);
    ctx.lineTo(resultRightX, lineY);
    ctx.stroke();
    ctx.lineWidth = 2;
    
    // 绘制和
    y += lineHeight;
    
    // 修改：确保结果的小数点与上面的小数点对齐
    // 先找到小数点的位置
    let result_x = dot_pos_x;
    
    // 绘制结果
    let arrResult = [];
    
    // 先绘制小数点左侧的数字（从小数点向左）
    x = result_x;
    for (i = dot_pos_sum - 1; i >= 0; i--) {
        s = sum[i];
        ctx.fillText(s, x, y);
        
        arrResult.push({"X": x, "Y": y, "V": s, "visible": true});
        
        if (i >= 1 && sum[i-1] === ".") {
            x -= gap - gap * 0.5; // 调整小数点前的间距，原来是2/3
        } else {
            x -= gap;
        }
    }
    
    // 如果有小数点，绘制小数点
    if (dot_pos_sum < sum.length) {
        // 确保小数点明显可见
        ctx.font = `bold ${fontSize}pt Times New Roman`;
        ctx.fillText(".", result_x, y);
        ctx.font = `${fontSize}pt Times New Roman`;
        
        arrResult.push({"X": result_x, "Y": y, "V": ".", "visible": true});
        
        // 绘制小数点右侧的数字（从小数点向右）
        x = result_x + gap * 0.3; // 调整小数点后的间距，原来是1/3
        for (i = dot_pos_sum + 1; i < sum.length; i++) {
            s = sum[i];
            ctx.fillText(s, x, y);
            
            arrResult.push({"X": x, "Y": y, "V": s, "visible": true});
            
            if (i < sum.length - 1 && sum[i+1] === ".") {
                x += gap * 0.5; // 调整小数点前的间距，原来是2/3
            } else {
                x += gap;
            }
        }
    }
    
    // 移除进位显示代码
    // options.showSteps 设置为 false 来禁用进位显示
    options.showSteps = false;
    
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

export { renderAddition }; 