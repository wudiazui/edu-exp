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
    const { addend1, addend2, sum, carries } = result;
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

export { renderAddition }; 