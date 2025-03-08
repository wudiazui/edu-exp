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

    // 初始化最大边界变量，用于自动调整画布大小
    let maxRight = 0;
    let maxBottom = 0;

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
    const lineHeight = fontSize * 1.5; // 减小行高，原来是1.5

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
    startX = 40 + (divisor.length + 1) * gap; // 减小起始位置，原来是50
  }

  // 确保最小起始位置
  if (startX < 5 * gap) { // 减小最小起始位置，原来是6
    startX = 5 * gap;
  }

  let startY = options.isMobile ? 150 : 50; // 减小起始Y坐标，原来是200/100

  // 绘制除号结构
  // 首先绘制除数
  let x = startX - gap - 5;
  let y = startY + gap/2 + fontSize;
  let currentY = y; // Initialize currentY with y

  // 存储除数和被除数的位置信息，用于后续步骤对齐
  let arrChushu = [];
  let arrBeiChushu = [];
  let arrShang = []; // 存储商的位置信息
  let arrAmonRlt = []; // 存储计算步骤的位置信息

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

  // 增加被除数的起始位置，使其向右移动
  const extraGap = gap * 0.5; // 减小额外间距，从0.8改为0.5

  // 绘制除号结构
  drawDivisionStruct(ctx, startX, startY, startX + dividendWidth + gap + extraGap, fontSize);

  // 绘制被除数，在除号右侧，增加额外间距
  x = startX + extraGap;
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

    // 更新最大右边界
    maxRight = Math.max(maxRight, x);
  }

  // 绘制商，在除号上方，采用右对齐方式
  let quotientY = startY - gap/3; // 减小商与除号的距离，原来是gap/2

  // 处理商，只保留整数部分
  let integerQuotient = quotient;
  let decimalPointIndex = quotient.indexOf('.');

  // 如果商中有小数点，只保留整数部分
  // 这样在商为小数时，只显示整数部分，余数会在最后一步计算中显示
  if (decimalPointIndex !== -1) {
    integerQuotient = quotient.substring(0, decimalPointIndex);
  }

  // 计算商的起始位置，使其右对齐
  // 首先计算商的总宽度
  let quotientWidth = 0;
  for (let i = 0; i < integerQuotient.length; i++) {
    quotientWidth += gap;
  }

  // 计算商的起始X坐标，使其右对齐
  // 商的最后一位应该与被除数的最后一位对齐
  let quotientStartX = startX + extraGap + dividendWidth - quotientWidth;

  // 确保商的起始位置不小于startX
  if (quotientStartX < startX + extraGap) {
    quotientStartX = startX + extraGap;
  }

  // 绘制商
  x = quotientStartX;
  for (let i = 0; i < integerQuotient.length; i++) {
    const s = integerQuotient[i];
    ctx.fillText(s, x, quotientY);

    // 存储商的位置信息
    arrShang.push({"X": x, "Y": quotientY, "V": s, "visible": true});

    x += gap;

    // 更新最大右边界
    maxRight = Math.max(maxRight, x);
  }

  // 绘制计算步骤
  if (steps && steps.length > 0) {
    // 处理每一步计算
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // 获取前一步的余数（如果有）
      const prevRemainder = i > 0 ? steps[i-1].remainder : null;

      // 计算当前步骤的位置
      let subtractionStartX;

      if (i === 0) {
        // 第一步，减数的最后一位应该与被减数的第divisor.length位对齐
        let minuendLength = divisor.length;
        if (parseInt(dividend.substring(0, minuendLength)) < parseInt(divisor)) {
          // 如果被减数小于除数，则多取一位
          minuendLength++;
        }

        // 减数的最后一位应该与被减数的最后一位对齐
        let lastDigitIndex = minuendLength - 1;
        if (lastDigitIndex < arrBeiChushu.length) {
          // 减数的最后一位应该与被减数的最后一位对齐
          subtractionStartX = arrBeiChushu[lastDigitIndex].X - (step.subtraction.length - 1) * gap;
        } else {
          // 如果超出被除数的长度，则使用最后一位的位置
          subtractionStartX = arrBeiChushu[arrBeiChushu.length - 1].X - (step.subtraction.length - 1) * gap;
        }
      } else {
        // 后续步骤，减数的最后一位应该与当前处理的被除数位对齐

        // 计算当前步骤处理的被除数位的索引
        let currentDigitIndex;

        if (i === 1) {
          // 第二步，索引应该是第一步处理的最后一位加1
          let firstStepLastDigitIndex = divisor.length - 1;
          if (parseInt(dividend.substring(0, divisor.length)) < parseInt(divisor)) {
            firstStepLastDigitIndex++;
          }
          currentDigitIndex = firstStepLastDigitIndex + 1;

          // 特殊处理：如果是806÷2这样的情况，第一步余数为0，第二步直接处理第三位数字
          if (prevRemainder === "0") {
            // 当第一步余数为0时，第二步应该直接处理下一位数字
            // 跳过一位，因为零余数不占位
            currentDigitIndex += 1;
          }
        } else {
          // 后续步骤，索引应该是前一步处理的最后一位加1
          // 修改这里的计算逻辑，使其更准确地定位当前处理的位置
          if (i === 2) {
            // 第三步，需要考虑第二步的余数位置
            let secondStepLastDigitIndex = divisor.length;
            if (parseInt(dividend.substring(0, divisor.length)) < parseInt(divisor)) {
              secondStepLastDigitIndex++;
            }
            currentDigitIndex = secondStepLastDigitIndex + 1;

            // 如果前一步的余数为0，需要调整
            if (prevRemainder === "0") {
              currentDigitIndex += 1;
            }
          } else {
            // 其他后续步骤
            currentDigitIndex = divisor.length + i;

            // 特殊处理：如果前一步的余数为0，需要调整当前步骤的位置
            if (prevRemainder === "0") {
              // 当余数为0时，下一步应该直接处理下一位数字
              // 跳过一位，因为零余数不占位
              currentDigitIndex += 1;
            }
          }
        }

        if (currentDigitIndex < arrBeiChushu.length) {
          // 减数的最后一位应该与当前处理的被除数位对齐
          subtractionStartX = arrBeiChushu[currentDigitIndex].X - (step.subtraction.length - 1) * gap;

          // 特殊处理：如果减数只有一位数字，直接与被除数对齐
          if (step.subtraction.length === 1) {
            subtractionStartX = arrBeiChushu[currentDigitIndex].X;
          }
        } else {
          // 如果超出被除数的长度，则使用最后一位的位置
          subtractionStartX = arrBeiChushu[arrBeiChushu.length - 1].X - (step.subtraction.length - 1) * gap;
        }
      }

      // 确保减数的起始位置不小于startX
      if (subtractionStartX < startX + extraGap) {
        subtractionStartX = startX + extraGap;
      }

      // 绘制减数（当前商位 * 除数）
      const subtraction = step.subtraction;

      // 绘制减数
      x = subtractionStartX;
      for (let j = 0; j < subtraction.length; j++) {
        const s = subtraction[j];
        ctx.fillText(s, x, currentY + lineHeight);

        // 存储减数位置信息
        arrAmonRlt.push({"X": x, "Y": currentY + lineHeight, "V": s, "visible": true});

        x += gap;
      }

      // 绘制余数
      const remainder = step.remainder;

      // 确保余数的位置与减数对齐
      // 如果余数比减数短，需要右对齐
      let remainderStartX = subtractionStartX;
      if (remainder.length < subtraction.length) {
        // 计算右对齐的起始位置
        remainderStartX = subtractionStartX + (subtraction.length - remainder.length) * gap;
      }

      // 特殊处理：如果减数只有一位数字且余数也只有一位数字，确保它们对齐
      if (subtraction.length === 1 && remainder.length === 1) {
        remainderStartX = subtractionStartX;
      }

      // 计算余数的宽度（包括可能的补位数字）
      let remainderWidth = remainder.length * gap;

      // 如果是第一步，考虑补位数字的宽度
      let totalRemainderWidth = remainderWidth;
      if (i === 0) {
        // 获取第一步计算后剩余的数字
        let minuendLength = divisor.length > 1 ? divisor.length : 1;
        if (parseInt(dividend.substring(0, minuendLength)) < parseInt(divisor)) {
          // 如果被减数小于除数，则多取一位
          minuendLength++;
        }

        // 获取剩余的数字
        const remainingDigits = dividend.substring(minuendLength);

        if (remainingDigits.length > 0) {
          // 将剩余数字的宽度加到总宽度中
          totalRemainderWidth += remainingDigits.length * gap;
        }
      }

      // 绘制横线 - 与图片一致，只在减数下方绘制
      // 横线宽度根据下方数字（余数+可能的补位数字）的宽度计算
      ctx.beginPath();
      // 调整横线的垂直位置，使其稍微提高
      // 进一步增加横线两侧的延伸长度，从0.5改为1.0，使其更接近图片中的效果
      ctx.moveTo(remainderStartX - gap * 1.0, currentY + lineHeight + gap/6);

      // 横线长度根据下方数字的宽度确定，两侧都延长
      ctx.lineTo(remainderStartX + totalRemainderWidth + gap * 1.0, currentY + lineHeight + gap/6);
      ctx.stroke();

       // 绘制余数
      x = remainderStartX;
      for (let j = 0; j < remainder.length; j++) {
        const s = remainder[j];

        // 如果余数是0且不是最后一步，不显示但保留位置
        const isZeroRemainder = remainder === "0" && i < steps.length - 1;

        if (isZeroRemainder) {
          // 不绘制数字，但仍然存储位置信息，标记为不可见
          arrAmonRlt.push({"X": x, "Y": currentY + lineHeight * 1.7, "V": s, "visible": false});
        } else {
          // 正常绘制数字
          ctx.fillText(s, x, currentY + lineHeight * 2.3);

          // 存储余数位置信息
          arrAmonRlt.push({"X": x, "Y": currentY + lineHeight * 1.7, "V": s, "visible": true});
        }

        x += gap;

        // 更新最大右边界和底部边界
        maxRight = Math.max(maxRight, x);
        maxBottom = Math.max(maxBottom, currentY + lineHeight * 1.8);
      }

      // 将剩余的数字向下补位
      // 例如：对于712 ÷ 8，第一步计算71 ÷ 8后，余数是7，需要将剩余的2补位到7的旁边，形成72
      if (i === 0) {
        // 获取第一步计算后剩余的数字
        let minuendLength = divisor.length > 1 ? divisor.length : 1;
        if (parseInt(dividend.substring(0, minuendLength)) < parseInt(divisor)) {
          // 如果被减数小于除数，则多取一位
          minuendLength++;
        }

        // 获取剩余的数字
        const remainingDigits = dividend.substring(minuendLength);

        if (remainingDigits.length > 0) {
          // 将剩余的数字补位到余数的右侧
          let remainingX = x;

          // 找到第一个非零数字的位置
          let firstNonZeroIndex = remainingDigits.search(/[1-9]/);
          if (firstNonZeroIndex === -1) {
            firstNonZeroIndex = remainingDigits.length; // 如果没有非零数字，则所有数字都是零
          }

          for (let j = 0; j < remainingDigits.length; j++) {
            const s = remainingDigits[j];

            // 如果余数是0且当前数字是前导零，则不显示但保留位置
            const isZeroRemainder = remainder === "0";

            if (isZeroRemainder && s === "0" && j < firstNonZeroIndex) {
              // 不绘制数字，但仍然存储位置信息，标记为不可见
              arrAmonRlt.push({"X": remainingX, "Y": currentY + lineHeight * 1.7, "V": s, "visible": false});

              // 只增加X坐标
              remainingX += gap;
            } else {
              // 正常绘制数字
              ctx.fillText(s, remainingX, currentY + lineHeight * 2.3);

              // 存储补位数字的位置信息
              arrAmonRlt.push({"X": remainingX, "Y": currentY + lineHeight * 1.7, "V": s, "visible": true});

              remainingX += gap;
            }

            // 更新最大右边界和底部边界
            maxRight = Math.max(maxRight, remainingX);
            maxBottom = Math.max(maxBottom, currentY + lineHeight * 2);
          }
        }
      } else {
        // 为后续步骤添加补位逻辑
        // 如果不是最后一步，且还有下一位数字需要处理，将其补位到余数的右侧
        if (i < steps.length - 1) {
          // 计算当前步骤处理到的位置
          let currentProcessedIndex = divisor.length + i;
          if (parseInt(dividend.substring(0, divisor.length)) < parseInt(divisor)) {
            currentProcessedIndex++;
          }

          // 检查是否还有下一位数字
          if (currentProcessedIndex < dividend.length) {
            // 获取下一位数字
            const nextDigit = dividend[currentProcessedIndex];

            // 将下一位数字补位到余数的右侧
            // 只有当余数不为0或者下一位数字不为0时才显示
            if (remainder !== "0" || nextDigit !== "0") {
              ctx.fillText(nextDigit, x, currentY + lineHeight * 2.3);

              // 存储补位数字的位置信息
              arrAmonRlt.push({"X": x, "Y": currentY + lineHeight * 1.7, "V": nextDigit, "visible": true});

              // 更新最大右边界和底部边界
              maxRight = Math.max(maxRight, x + gap);
              maxBottom = Math.max(maxBottom, currentY + lineHeight * 2);
            }
          }
        }
      }

      // 更新Y坐标
      currentY += lineHeight * 2.2; // 减小步骤间距，原来可能是2.5或3

      // 更新最大底部边界
      maxBottom = Math.max(maxBottom, currentY);
    }
  }

  // 如果启用了自动调整大小，则调整Canvas大小
  if (options.autoResize) {
    // 计算所需的宽度和高度
    let requiredWidth = maxRight + gap * 2; // 减小右侧边距
    let requiredHeight = maxBottom + gap * 2; // 减小底部边距

    // 确保最小宽度和高度
    if (requiredWidth < 150) requiredWidth = 150; // 减小最小宽度，原来可能更大
    if (requiredHeight < 120) requiredHeight = 120; // 减小最小高度，原来可能更大

    // 如果当前画布大小不足，则调整大小
    if (ctx.canvas.width < requiredWidth || ctx.canvas.height < requiredHeight) {
      // 更新画布大小
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
      renderDivision(ctx, result, {...options, autoResize: false});
      return;
    }
  }

  // 更新最大右边界和底部边界
  maxRight = Math.max(maxRight, startX + dividendWidth + gap + extraGap);
    maxBottom = Math.max(maxBottom, startY + lineHeight);

  ctx.restore();
}

export { renderDivision };
