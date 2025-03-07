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
    const gap = fontSize * 1; // 使用一致的间距
    let startX;
    
    // 确保小数点对齐
    if (dot_pos1 >= dot_pos2) {
        startX = dot_pos1 * gap + 4 * gap;
    } else {
        startX = dot_pos2 * gap + 4 * gap;
    }
    
    // 确保小数部分也对齐
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
    
    // 绘制竖式 - 使用统一的间距处理
    x = startX - gap - 5;
    y = startY + gap/2 + fontSize;
    
    let dot_pos_x = x;
    
    // 绘制第一个加数
    let arrFactor1 = [];
    for (i = addend1.length - 1; i >= 0; i--) {
        s = addend1[i];
        
        // 使小数点更明显
        if (s === ".") {
            ctx.font = `bold ${fontSize}pt Times New Roman`;
            ctx.fillText(s, x, y);
            ctx.font = `${fontSize}pt Times New Roman`;
            dot_pos_x = x;
        } else {
            ctx.fillText(s, x, y);
        }
        
        arrFactor1.push({"X": x, "Y": y, "V": s, "visible": true});
        
        // 统一使用相同的间距
        x -= gap;
    }
    
    if (x < maxLeft) {
        maxLeft = x;
    }
    
    // 重置x位置并增加y位置
    x = startX - gap - 5; // 使用与第一个加数相同的起始位置
    y += lineHeight;
    
    // 绘制第二个加数 - 从右向左绘制所有数字
    let arrFactor2 = [];
    for (i = addend2.length - 1; i >= 0; i--) {
        s = addend2[i];
        
        // 使小数点更明显
        if (s === ".") {
            ctx.font = `bold ${fontSize}pt Times New Roman`;
            ctx.fillText(s, x, y);
            ctx.font = `${fontSize}pt Times New Roman`;
        } else {
            ctx.fillText(s, x, y);
        }
        
        arrFactor2.push({"X": x, "Y": y, "V": s, "visible": true});
        
        // 统一使用相同的间距
        x -= gap;
    }
    
    if (x < maxLeft) {
        maxLeft = x;
    }
    
    let prev_x = x;
    
    // 绘制加号
    x = prev_x - gap * 1.2; // 调整加号位置
    ctx.fillText("+", x, y);
    
    // 绘制横线
    ctx.beginPath();
    let lineY = y + fontSize * 0.05; // 横线位置靠近加数
    ctx.lineWidth = 1;
    
    // 找到最左侧的位置（包括加号）
    let leftMostX = x - gap * 0.8; // 加号位置左侧一点点
    
    // 计算结果的最右侧位置
    let resultRightX = startX + gap * 0.2; // 结果右侧多一点点
    
    // 调整横线起点和终点，使其刚好超过数字宽度一点
    ctx.moveTo(leftMostX, lineY);
    ctx.lineTo(Math.max(resultRightX, maxRight + gap), lineY);
    ctx.stroke();
    ctx.lineWidth = 2;
    
    // 绘制和
    y += lineHeight;
    
    // 绘制结果 - 从右向左绘制所有数字，确保对齐
    let arrResult = [];
    x = startX - gap - 5; // 使用与加数相同的起始位置
    
    for (i = sum.length - 1; i >= 0; i--) {
        s = sum[i];
        
        // 使小数点更明显
        if (s === ".") {
            ctx.font = `bold ${fontSize}pt Times New Roman`;
            ctx.fillText(s, x, y);
            ctx.font = `${fontSize}pt Times New Roman`;
        } else {
            ctx.fillText(s, x, y);
        }
        
        arrResult.push({"X": x, "Y": y, "V": s, "visible": true});
        
        // 统一使用相同的间距
        x -= gap;
    }
    
    // 移除进位显示代码
    options.showSteps = false;
    
    // 调整画布大小以适应内容
    if (options.autoResize) {
        // 计算所需的画布宽度
        // 最右侧位置 + 右侧边距
        const rightPadding = gap * 3;
        // 最左侧位置 + 左侧边距
        const leftPadding = gap * 3;
        
        // 确保maxLeft有有效值
        if (maxLeft === startX - gap * 5) {
            // 如果maxLeft没有被更新，根据加数长度计算
            maxLeft = Math.min(startX - Math.max(addend1.length, addend2.length, sum.length) * gap, startX - gap * 5);
        }
        
        // 计算所需的宽度：从最左侧到最右侧的距离 + 边距
        const requiredWidth = Math.max(startX - maxLeft, startX + gap * 2) + rightPadding;
        
        // 计算所需的高度：最后一行的Y坐标 + 底部边距
        const bottomPadding = gap * 3;
        const requiredHeight = y + bottomPadding;
        
        // 更新画布大小
        if (ctx.canvas) {
            ctx.canvas.width = requiredWidth;
            ctx.canvas.height = requiredHeight;
            
            // 重新绘制内容
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = options.backgroundColor || '#FFFFFF';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            // 重新设置字体和样式
            ctx.font = `${options.fontSize}pt ${options.fontFamily || 'Times New Roman'}`;
            ctx.fillStyle = options.color || '#000000';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            
            // 重新调用渲染函数，但禁用autoResize以避免无限循环
            renderAddition(ctx, result, {...options, autoResize: false});
        }
    }
    
    ctx.restore();
}

export { renderAddition }; 