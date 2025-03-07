function parseExpression(expr) {
  // 清理输入字符串，处理不同的运算符和等号
  const cleaned = expr
    .replace(/\s+/g, "")
    .split("=")[0] // 只取等号左边的部分
    .replace(/×/g, "*")
    .replace(/÷/g, "/");

  // 修改正则表达式，只匹配正数，但支持减法运算符
  const match = cleaned.match(/^(\d*\.?\d+)([\+\-\*\/])(\d*\.?\d+)$/);
  if (!match) throw new Error("Invalid expression format");
  return {
    num1: parseFloat(match[1]),
    operator: match[2],
    num2: parseFloat(match[3]),
  };
}

function getAdditionSteps(num1, num2) {
  // 将数字转换为字符串并处理小数点
  const [num1Int, num1Dec = ""] = num1.toString().split(".");
  const [num2Int, num2Dec = ""] = num2.toString().split(".");

  // 对齐小数位
  const maxDecLength = Math.max(num1Dec.length, num2Dec.length);
  const paddedNum1Dec = num1Dec.padEnd(maxDecLength, "0");
  const paddedNum2Dec = num2Dec.padEnd(maxDecLength, "0");

  // 合并整数和小数部分
  const num1Str = num1Int + paddedNum1Dec;
  const num2Str = num2Int + paddedNum2Dec;

  // 计算结果
  const result = (parseFloat(num1) + parseFloat(num2)).toFixed(maxDecLength);

  // 计算每一位的进位情况
  const carries = [];
  let carry = 0;
  let i = num1Str.length - 1;
  let j = num2Str.length - 1;
  const steps = [];

  while (i >= 0 || j >= 0) {
    const digit1 = i >= 0 ? parseInt(num1Str[i]) : 0;
    const digit2 = j >= 0 ? parseInt(num2Str[j]) : 0;
    const sum = digit1 + digit2 + carry;
    const currentDigit = sum % 10;

    // 记录这一位的计算步骤
    steps.unshift({
      digit1,
      digit2,
      carry,
      sum: currentDigit,
      isDecimal: i >= 0 && i === num1Int.length - 1, // 标记小数点位置
    });

    carry = Math.floor(sum / 10);
    carries.unshift(carry);
    i--;
    j--;
  }

  // 如果最后还有进位，需要额外处理
  if (carry > 0) {
    carries.unshift(carry);
  }

  return {
    carries,
    steps,
    result,
    decimalPosition: maxDecLength, // 记录小数位数
  };
}

function getSubtractionSteps(num1, num2) {
  // 将数字转换为字符串并处理小数点
  const [num1Int, num1Dec = ""] = num1.toString().split(".");
  const [num2Int, num2Dec = ""] = num2.toString().split(".");

  // 对齐小数位
  const maxDecLength = Math.max(num1Dec.length, num2Dec.length);
  const paddedNum1Dec = num1Dec.padEnd(maxDecLength, "0");
  const paddedNum2Dec = num2Dec.padEnd(maxDecLength, "0");

  // 合并整数和小数部分
  const num1Str = num1Int + paddedNum1Dec;
  const num2Str = num2Int + paddedNum2Dec;

  // 计算结果，保留正确的小数位数
  const result = (parseFloat(num1) - parseFloat(num2)).toFixed(maxDecLength);

  // 计算借位情况
  const borrows = [];
  let i = num1Str.length - 1;
  let j = num2Str.length - 1;
  let num1Array = num1Str.split("").map(Number);
  const steps = [];

  while (i >= 0) {
    let digit1 = num1Array[i];
    const digit2 = j >= 0 ? parseInt(num2Str[j]) : 0;
    let borrowed = false;

    if (j >= 0 && digit1 < digit2) {
      // 需要借位
      let k = i - 1;
      while (k >= 0 && num1Array[k] === 0) {
        num1Array[k] = 9;
        k--;
      }
      if (k >= 0) {
        num1Array[k]--;
        digit1 += 10;
        borrowed = true;
      }
    }

    const diff = digit1 - (j >= 0 ? digit2 : 0);
    steps.unshift({
      digit1,
      digit2: j >= 0 ? digit2 : 0,
      borrowed,
      diff,
      isDecimal: i >= 0 && i === num1Int.length - 1, // 标记小数点位置
    });

    borrows.unshift(borrowed);
    i--;
    j--;
  }

  return {
    borrows,
    steps,
    result,
    decimalPosition: maxDecLength, // 记录小数位数
  };
}

function getMultiplicationSteps(num1, num2) {
  // 处理小数点
  const [num1Int, num1Dec = ""] = num1.toString().split(".");
  const [num2Int, num2Dec = ""] = num2.toString().split(".");

  // 计算小数位数
  const decimalPlaces = num1Dec.length + num2Dec.length;

  // 将数字转换为整数进行计算
  const num1WithoutDot = num1Int + num1Dec;
  const num2WithoutDot = num2Int + num2Dec;

  // 计算结果
  const result = (num1 * num2).toFixed(decimalPlaces);

  // 计算每一步的部分积
  const partialProducts = [];
  const carries = [];

  for (let i = num2WithoutDot.length - 1; i >= 0; i--) {
    const digit = parseInt(num2WithoutDot[i]);
    let carry = 0;
    let partialResult = "";

    // 计算当前数字的部分积
    for (let j = num1WithoutDot.length - 1; j >= 0; j--) {
      const product = digit * parseInt(num1WithoutDot[j]) + carry;
      partialResult = (product % 10) + partialResult;
      carry = Math.floor(product / 10);
    }

    if (carry > 0) {
      partialResult = carry + partialResult;
    }

    // 添加适当数量的0
    partialResult = partialResult.padEnd(
      partialResult.length + (num2WithoutDot.length - 1 - i),
      "0",
    );

    partialProducts.push(partialResult);
    carries.push(carry);
  }

  return {
    carries,
    partialProducts,
    result,
    decimalPlaces, // 添加小数位数信息
  };
}

function getDivisionSteps(num1, num2, precision = 6) {
  // Convert inputs to numbers and handle decimals
  num1 = parseFloat(num1);
  num2 = parseFloat(num2);

  if (num2 === 0) {
    return {
      quotient: "undefined",
      remainder: "0",
      steps: [],
      isInteger: false,
      isRecurring: false,
      recurringPattern: "",
      decimalPosition: -1,
      hasRemainder: false
    };
  }

  // Move decimal point to make num1 and num2 integers
  const num1Str = num1.toString();
  const num2Str = num2.toString();
  const num1DecimalPlaces = (num1Str.split(".")[1] || "").length;
  const num2DecimalPlaces = (num2Str.split(".")[1] || "").length;

  // Adjust numbers to remove decimals
  const multiplier = Math.pow(
    10,
    Math.max(num1DecimalPlaces, num2DecimalPlaces),
  );
  const adjustedNum1 = num1 * multiplier;
  const adjustedNum2 = num2 * multiplier;

  // Calculate initial quotient
  const initialQuotient = adjustedNum1 / adjustedNum2;
  const isInteger = Number.isInteger(initialQuotient);

  // 只取整数部分的商
  const integerQuotient = Math.floor(initialQuotient);
  // 计算余数
  const remainder = adjustedNum1 - integerQuotient * adjustedNum2;
  // 标记是否有余数
  const hasRemainder = remainder > 0;

  // 格式化商和余数
  let quotientStr = integerQuotient.toString();
  let remainderStr = remainder.toString();

  // 检查是否有循环小数（仅用于显示说明，实际计算仍使用整数部分）
  let isRecurring = false;
  let recurringPattern = "";

  if (!isInteger) {
    // 检测循环小数模式
    const extendedPrecision = precision * 2;
    const extendedQuotient = (adjustedNum1 / adjustedNum2).toFixed(extendedPrecision);
    const decimalPart = extendedQuotient.split('.')[1] || "";

    // 尝试检测循环模式
    if (decimalPart.length > 0) {
      for (let patternLength = 1; patternLength <= Math.min(6, Math.floor(decimalPart.length / 2)); patternLength++) {
        const pattern = decimalPart.substring(0, patternLength);
        const nextPattern = decimalPart.substring(patternLength, patternLength * 2);

        if (pattern === nextPattern) {
          isRecurring = true;
          recurringPattern = pattern;
          break;
        }
      }

      // 如果没有找到短模式，尝试更长的模式
      if (!isRecurring && decimalPart.length > 12) {
        for (let patternLength = 7; patternLength <= Math.min(12, Math.floor(decimalPart.length / 2)); patternLength++) {
          const pattern = decimalPart.substring(0, patternLength);
          const nextPattern = decimalPart.substring(patternLength, patternLength * 2);

          if (pattern === nextPattern) {
            isRecurring = true;
            recurringPattern = pattern;
            break;
          }
        }
      }
    }
  }

  // 生成计算步骤
  const steps = [];
  const adjustedNum1Str = adjustedNum1.toString();
  let currentNum = "";
  let position = 0;

  // 跟踪小数点在商中的位置
  const decimalPosition = adjustedNum1Str.length;

  // 处理每一位数字
  // 只计算到整数部分结束
  for (let i = 0; i < adjustedNum1Str.length; i++) {
    currentNum += adjustedNum1Str[i];
    let currentNumInt = parseInt(currentNum);

    // 如果当前数字小于除数且不是最后一位，继续
    if (currentNumInt < adjustedNum2 && i < adjustedNum1Str.length - 1) {
      continue;
    }

    const currentDigit = Math.floor(currentNumInt / adjustedNum2);
    const product = currentDigit * adjustedNum2;
    const difference = currentNumInt - product;

    steps.push({
      dividend: currentNumInt,
      product: product,
      difference: difference,
      quotientDigit: currentDigit,
      broughtDownZero: false
    });

    // 更新当前数字为余数
    currentNum = difference.toString();
  }

  // 如果最后一步的差值不为0，这就是余数
  if (steps.length > 0 && steps[steps.length - 1].difference > 0) {
    // 已经在hasRemainder中标记了
  }

  return {
    quotient: quotientStr,
    remainder: remainderStr,
    steps,
    isInteger,
    isRecurring,
    recurringPattern,
    decimalPosition,
    hasRemainder
  };
}

export async function generateVerticalArithmeticImage(expression) {
  const { num1, operator, num2 } = parseExpression(expression);

  // 设置画布参数
  const charWidth = 20;
  const lineHeight = 30;
  const padding = 20;

  // 根据运算类型计算画布大小和获取步骤
  let width, height, steps;
  const displayOperator =
    operator === "*" ? "×" : operator === "/" ? "÷" : operator;

  if (operator === "*") {
    steps = getMultiplicationSteps(num1, num2);
    const maxWidth = Math.max(
      num1.toString().length,
      num2.toString().length,
      steps.result.length,
      ...steps.partialProducts.map((p) => p.length),
    );
    width = (maxWidth + 2) * charWidth + padding * 2;
    height = (4 + steps.partialProducts.length) * lineHeight + padding * 2;
  } else if (operator === "/") {
    steps = getDivisionSteps(num1, num2);
    console.log(steps);

    // 计算弧线的参数
    const radius = charWidth * 1.5;
    const startAngle = -Math.PI * 0.1;
    const endAngle = Math.PI * 0.2;

    // 计算弧线最高点的x坐标
    const arcTopX = padding + charWidth * 0.5 + radius * Math.sin(-startAngle);

    // 绘制除数（先绘制除数）
    const maxWidth = Math.max(
      num1.toString().length,
      num2.toString().length,
      steps.quotient.length * 2,
    );
    width = (maxWidth + 4) * charWidth + padding * 2;
    height = (3 + steps.steps.length * 2) * lineHeight + padding * 2;
  } else {
    steps =
      operator === "+"
        ? getAdditionSteps(num1, num2)
        : getSubtractionSteps(num1, num2);
    // 考虑小数点的宽度计算
    const maxLength = Math.max(
      num1.toString().length,
      num2.toString().length,
      steps.result.length,
    );
    width = (maxLength + 2) * charWidth + padding * 2;
    height = 5 * lineHeight + padding * 2;
  }

  // 创建画布
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // 设置白色背景
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  // 设置文本样式
  ctx.fillStyle = "black";
  ctx.font = "24px monospace";
  ctx.textBaseline = "middle";

  if (operator === "*") {
    // 绘制乘法过程
    ctx.textAlign = "right";
    ctx.fillText(num1.toString(), width - padding, padding + lineHeight);
    ctx.textAlign = "left";
    ctx.fillText(displayOperator, padding, padding + 2 * lineHeight);
    ctx.textAlign = "right";
    ctx.fillText(num2.toString(), width - padding, padding + 2 * lineHeight);

    // 绘制分隔线
    ctx.beginPath();
    ctx.moveTo(padding, padding + 2.5 * lineHeight);
    ctx.lineTo(width - padding, padding + 2.5 * lineHeight);
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制部分积
    let currentY = padding + 3.5 * lineHeight;
    steps.partialProducts.forEach((product, index) => {
      if (steps.carries[index]) {
        ctx.font = "16px monospace";
        ctx.fillStyle = "red";
        ctx.fillText(
          steps.carries[index].toString(),
          width - padding - (product.length + 1) * charWidth,
          currentY - 0.5 * lineHeight,
        );
        ctx.font = "24px monospace";
        ctx.fillStyle = "black";
      }
      ctx.fillText(product, width - padding, currentY);
      currentY += lineHeight;
    });

    // 绘制最终结果分隔线
    ctx.beginPath();
    ctx.moveTo(padding, currentY - 0.5 * lineHeight);
    ctx.lineTo(width - padding, currentY - 0.5 * lineHeight);
    ctx.stroke();

    // 绘制最终结果
    ctx.fillText(steps.result, width - padding, currentY + 0.5 * lineHeight);
  } else if (operator === "/") {
    // 处理除法的特殊情况
    const steps = getDivisionSteps(num1, num2);
    console.log(steps);

    // 计算弧线的参数
    const radius = charWidth * 1.5;
    const startAngle = -Math.PI * 0.1;
    const endAngle = Math.PI * 0.2;

    // 计算弧线最高点的x坐标
    const arcTopX = padding + charWidth * 0.5 + radius * Math.sin(-startAngle);

    // 绘制除数（先绘制除数）
    ctx.textAlign = "right";
    ctx.fillText(num2.toString(), arcTopX, padding + lineHeight);

    // 绘制弧线
    ctx.beginPath();
    ctx.arc(
      padding + charWidth * 0.01,
      padding + lineHeight * 0.8,
      radius,
      startAngle,
      endAngle,
      false,
    );
    ctx.stroke();

    // 在弧线上方绘制横线
    const dividendLength = num1.toString().length;
    ctx.beginPath();
    ctx.moveTo(arcTopX + charWidth * 0.5, padding + lineHeight * 0.5);
    ctx.lineTo(
      arcTopX + charWidth * (dividendLength + 0.1),
      padding + lineHeight * 0.5,
    );
    ctx.stroke();

    // 绘制被除数
    ctx.textAlign = "right";
    const numberEndX = arcTopX + charWidth * dividendLength + 0.2;
    ctx.fillText(num1.toString(), numberEndX, padding + lineHeight);

    // 绘制商
    ctx.fillText(steps.quotient, numberEndX, padding);

    // 绘制计算步骤
    let currentY = padding + 2 * lineHeight;
    let currentPosition = 0;
    // 使用传统竖式布局
    const stepStartX = arcTopX + charWidth * 0.5; // 从弧线右侧开始
    const num1Digits = num1.toString().split("");
    let decimalPointDrawn = false;

    // 调整画布高度以适应所有步骤
    const totalStepsHeight = steps.steps.length * lineHeight * 2 + lineHeight;
    const minHeight = padding * 2 + lineHeight * 3 + totalStepsHeight;
    if (height < minHeight) {
      height = minHeight;
      canvas.height = height;
      // 重新设置背景
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "black";
      ctx.font = "24px monospace";
      ctx.textBaseline = "middle";

      // 重新绘制之前的内容
      // 绘制除数
      ctx.textAlign = "right";
      ctx.fillText(num2.toString(), arcTopX, padding + lineHeight);

      // 重新绘制弧线
      ctx.beginPath();
      ctx.arc(
        padding + charWidth * 0.01,
        padding + lineHeight * 0.8,
        radius,
        startAngle,
        endAngle,
        false,
      );
      ctx.stroke();

      // 重新绘制横线
      ctx.beginPath();
      ctx.moveTo(arcTopX + charWidth * 0.5, padding + lineHeight * 0.5);
      ctx.lineTo(
        arcTopX + charWidth * (dividendLength + 0.1),
        padding + lineHeight * 0.5,
      );
      ctx.stroke();

      // 重新绘制被除数
      ctx.textAlign = "right";
      ctx.fillText(num1.toString(), numberEndX, padding + lineHeight);

      // 重新绘制商
      ctx.fillText(steps.quotient, numberEndX, padding);
    }

    // 处理第一步
    if (steps.steps.length > 0) {
      const firstStep = steps.steps[0];
      
      // 计算第一步被除数的位数和乘积的位数
      const firstDividendStr = firstStep.dividend.toString();
      const firstProductStr = firstStep.product.toString();
      
      // 绘制第一个乘积，与原始被除数对齐
      ctx.textAlign = "right";
      
      // 确保乘积与被除数对齐（按位对齐）
      // 例如：被除数712，乘积64，应该让6对齐7，4对齐1
      // 但实际上需要向右偏移一位，让6对齐1，4对齐2
      const productX = numberEndX - charWidth;
      ctx.fillText(firstProductStr, productX, currentY);

      // 绘制第一个分隔线
      ctx.beginPath();
      ctx.moveTo(stepStartX, currentY + lineHeight * 0.5);
      ctx.lineTo(numberEndX, currentY + lineHeight * 0.5);
      ctx.stroke();

      currentY += lineHeight;

      // 计算差值
      const firstDifferenceStr = firstStep.difference.toString();
      // 差值应该向右偏移一位
      const differenceX = numberEndX - charWidth;
      ctx.fillText(firstDifferenceStr, differenceX, currentY);

      // 更新当前位置
      currentPosition = firstStep.dividend.toString().length;
    }

    // 处理后续步骤
    for (let i = 1; i < steps.steps.length; i++) {
      const step = steps.steps[i];
      currentY += lineHeight;

      // 检查是否需要绘制小数点
      if (!decimalPointDrawn && currentPosition >= steps.decimalPosition) {
        // 在适当位置绘制小数点
        ctx.fillStyle = "blue";
        const decimalX = numberEndX - (currentPosition - steps.decimalPosition) * charWidth;
        ctx.fillText(".", decimalX, currentY - lineHeight * 0.5);
        ctx.fillStyle = "black";
        decimalPointDrawn = true;
      }

      // 如果是带下零的步骤，特殊处理
      if (step.broughtDownZero) {
        ctx.fillStyle = "blue";
        // 零应该与前一步差值的最后一位对齐
        const zeroX = numberEndX;
        ctx.fillText("0", zeroX, currentY);
        ctx.fillStyle = "black";
        continue;
      }
      
      // 计算当前步骤被除数和乘积的字符串
      const dividendStr = step.dividend.toString();
      const productStr = step.product.toString();
      
      // 乘积应该向右偏移一位
      const productX = numberEndX - charWidth;
      ctx.fillText(productStr, productX, currentY);

      // 绘制分隔线
      ctx.beginPath();
      ctx.moveTo(stepStartX, currentY + lineHeight * 0.5);
      ctx.lineTo(numberEndX, currentY + lineHeight * 0.5);
      ctx.stroke();
      
      currentY += lineHeight;
      
      // 计算差值
      const differenceStr = step.difference.toString();
      // 差值应该向右偏移一位
      const differenceX = numberEndX - charWidth;
      ctx.fillText(differenceStr, differenceX, currentY);

      // 更新当前位置
      if (i < steps.steps.length - 1) {
        const nextStep = steps.steps[i + 1];
        const differenceLength = step.difference.toString().length;
        const digitsNeeded = nextStep.dividend.toString().length - differenceLength;
        currentPosition += digitsNeeded;
      }
    }
  } else {
    // 绘制加减法过程（保持原有代码）
    if (
      operator === "+" &&
      steps.carries &&
      steps.carries.some((carry) => carry > 0)
    ) {
      ctx.font = "16px monospace";
      ctx.fillStyle = "red";
      let carryX = width - padding - charWidth;
      for (let i = steps.carries.length - 1; i >= 0; i--) {
        if (steps.carries[i] > 0) {
          ctx.fillText(
            steps.carries[i].toString(),
            carryX,
            padding + 0.5 * lineHeight,
          );
        }
        carryX -= charWidth;
      }
    } else if (operator === "-" && steps.borrows && steps.borrows.length > 0) {
      ctx.font = "16px monospace";
      ctx.fillStyle = "red";
      steps.borrows.forEach((pos) => {
        const x = width - padding - (num1.toString().length - pos) * charWidth;
        ctx.fillText("1", x, padding + 0.5 * lineHeight);
      });
    }

    ctx.font = "24px monospace";
    ctx.fillStyle = "black";

    // 绘制算式
    const startX = width - padding - charWidth;
    const startY = padding + lineHeight;

    // 绘制第一个数
    let num1Str = num1.toString();
    for (let i = num1Str.length - 1; i >= 0; i--) {
      const char = num1Str[i];
      if (char === ".") {
        ctx.fillText(
          ".",
          startX - (num1Str.length - 1 - i) * charWidth,
          startY,
        );
      } else {
        ctx.fillText(
          char,
          startX - (num1Str.length - 1 - i) * charWidth,
          startY,
        );
      }
    }

    // 绘制运算符
    ctx.fillText(
      displayOperator,
      startX -
        (Math.max(num1Str.length, num2.toString().length) + 1) * charWidth,
      startY + lineHeight,
    );

    // 绘制第二个数
    let num2Str = num2.toString();
    for (let i = num2Str.length - 1; i >= 0; i--) {
      const char = num2Str[i];
      if (char === ".") {
        ctx.fillText(
          ".",
          startX - (num2Str.length - 1 - i) * charWidth,
          startY + lineHeight,
        );
      } else {
        ctx.fillText(
          char,
          startX - (num2Str.length - 1 - i) * charWidth,
          startY + lineHeight,
        );
      }
    }

    // 绘制横线
    ctx.beginPath();
    ctx.moveTo(
      startX - Math.max(num1Str.length, num2Str.length) * charWidth,
      startY + lineHeight * 1.5,
    );
    ctx.lineTo(startX + charWidth, startY + lineHeight * 1.5);
    ctx.stroke();

    // 绘制结果
    let resultStr = steps.result;
    for (let i = resultStr.length - 1; i >= 0; i--) {
      const char = resultStr[i];
      if (char === ".") {
        ctx.fillText(
          ".",
          startX - (resultStr.length - 1 - i) * charWidth,
          startY + lineHeight * 2,
        );
      } else {
        ctx.fillText(
          char,
          startX - (resultStr.length - 1 - i) * charWidth,
          startY + lineHeight * 2,
        );
      }
    }

    // 绘制进位数字（如果有）
    if (steps.carries && steps.carries.some((carry) => carry > 0)) {
      for (let i = 0; i < steps.carries.length; i++) {
        if (steps.carries[i] > 0) {
          ctx.font = "16px monospace"; // 进位数字使用小一号字体
          ctx.fillText(
            steps.carries[i].toString(),
            startX - (steps.carries.length - 1 - i) * charWidth,
            startY - lineHeight * 0.4,
          );
          ctx.font = "24px monospace"; // 恢复原来的字体大小
        }
      }
    }
  }

  // 转换为图片数据
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
}

/**
 * 主接口函数 - 接收表达式并返回竖式计算图片
 * @param {string} expression - 数学表达式，如 "123+456", "78-45", "12*34", "56/7"
 * @param {Object} options - 配置选项
 * @param {string} options.backgroundColor - 背景颜色，默认为白色
 * @param {string} options.textColor - 文本颜色，默认为黑色
 * @param {number} options.fontSize - 字体大小，默认为20
 * @param {string} options.fontFamily - 字体，默认为Arial
 * @param {number} options.precision - 除法精度，默认为2
 * @returns {Promise<Blob>} 返回图片的Blob对象
 */
export async function renderVerticalCalculation(expression, options = {}) {
  // 默认选项
  const defaultOptions = {
    backgroundColor: "white",
    textColor: "black",
    fontSize: 20,
    fontFamily: "Arial",
    precision: 2
  };

  // 合并选项
  const mergedOptions = { ...defaultOptions, ...options };

  try {
    // 解析表达式
    const { num1, operator, num2 } = parseExpression(expression);

    // 根据运算符生成对应的竖式计算图片
    let result;
    if (operator === "/") {
      // 除法需要传递精度参数
      result = await generateVerticalArithmeticImage(expression, mergedOptions.precision);
    } else {
      result = await generateVerticalArithmeticImage(expression);
    }

    return result;
  } catch (error) {
    console.error("渲染竖式计算出错:", error);

    // 创建一个错误信息图片
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");

    // 设置背景
    ctx.fillStyle = mergedOptions.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 设置文本样式
    ctx.fillStyle = "red";
    ctx.font = `${mergedOptions.fontSize}px ${mergedOptions.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 绘制错误信息
    ctx.fillText("表达式格式错误: " + error.message, canvas.width / 2, canvas.height / 2);

    // 返回错误图片
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }
}

/**
 * 将竖式计算图片插入到指定的DOM元素中
 * @param {string} expression - 数学表达式
 * @param {string|HTMLElement} container - 容器元素或其ID
 * @param {Object} options - 配置选项
 */
export async function insertVerticalCalculationImage(expression, container, options = {}) {
  // 获取容器元素
  const containerElement = typeof container === 'string'
    ? document.getElementById(container)
    : container;

  if (!containerElement) {
    console.error('容器元素不存在');
    return;
  }

  try {
    // 生成竖式计算图片
    const imageBlob = await renderVerticalCalculation(expression, options);

    // 创建图片元素
    const img = document.createElement('img');
    img.src = URL.createObjectURL(imageBlob);
    img.alt = `竖式计算: ${expression}`;
    img.style.maxWidth = '100%';

    // 清空容器并插入图片
    containerElement.innerHTML = '';
    containerElement.appendChild(img);

    // 释放Blob URL
    img.onload = () => URL.revokeObjectURL(img.src);
  } catch (error) {
    console.error('插入竖式计算图片失败:', error);
    containerElement.innerHTML = `<div style="color: red;">计算错误: ${error.message}</div>`;
  }
}
