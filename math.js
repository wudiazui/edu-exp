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

function getDivisionSteps(num1, num2, precision = 2) {
  // Convert inputs to numbers and handle decimals
  num1 = parseFloat(num1);
  num2 = parseFloat(num2);

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

  // Calculate quotient with desired precision
  const precisionMultiplier = Math.pow(10, precision);
  const quotient =
    Math.floor((adjustedNum1 * precisionMultiplier) / adjustedNum2) /
    precisionMultiplier;
  const remainder = adjustedNum1 % adjustedNum2;

  // Check if quotient is an integer to determine how to format it
  const isInteger = Number.isInteger(quotient);

  // Generate calculation steps
  const steps = [];
  const adjustedNum1Str = adjustedNum1.toString();
  let currentNum = "";
  let position = 0;

  // Process each digit of the adjusted number
  for (let i = 0; i < adjustedNum1Str.length + precision; i++) {
    if (i < adjustedNum1Str.length) {
      currentNum += adjustedNum1Str[i];
    } else {
      // Add zeros for decimal calculation only if needed
      if (!isInteger) {
        currentNum += "0";
      } else if (i === adjustedNum1Str.length) {
        // Exit the loop early for integer results
        break;
      }
    }

    let currentNumInt = parseInt(currentNum);

    // If current number is smaller than divisor and not at the end, continue
    if (
      currentNumInt < adjustedNum2 &&
      i < adjustedNum1Str.length + (isInteger ? 0 : precision) - 1
    ) {
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
    });

    // Update current number to remainder
    currentNum = difference.toString();
  }

  return {
    quotient: isInteger ? quotient.toString() : quotient.toFixed(precision),
    remainder: isInteger
      ? Math.floor(remainder / multiplier).toString()
      : (remainder / multiplier).toFixed(precision),
    steps,
    isInteger,
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
    //let currentX = arcTopX + charWidth * (dividendLength - 0.1);
    let g_currentX = numberEndX - dividendLength * 0.7 * charWidth;
    const num1Digits = num1.toString().split("");

    steps.steps.forEach((step, index) => {
      ctx.textAlign = "left"; // 设置左对齐
      //currentX += (step.dividend.toString().length - step.product.toString().length) * charWidth * 0.7;
      let currentX = g_currentX;
      const productEndX = currentX + step.product.toString().length * 0.7 * charWidth;
      console.log("xy: ", currentX, productEndX, step.product);
      // 绘制乘积
      ctx.fillText(step.product.toString(), currentX, currentY);
      // 更新 currentX 为乘积数字的结束位置
      currentY += lineHeight;
      // 绘制步骤分隔线 (移动到乘积和差值之间)
      ctx.beginPath();
      ctx.moveTo(currentX, currentY - 0.5 * lineHeight);
      ctx.lineTo(productEndX + (dividendLength - step.product.toString().length) * 0.7 * charWidth, currentY - 0.5 * lineHeight,);
      ctx.stroke();
      // 绘制差值和剩余的被除数数字
      let remainingDigits = "";
      if (index < steps.steps.length - 1) {
        const nextStep = steps.steps[index + 1];
        //const digitsNeeded = nextStep.dividend.toString().length - step.difference.toString().length;
        const digitsNeeded = num1Digits.length - step.product.toString().length;
        for (let i = 0; i < digitsNeeded; i++) {
          currentPosition += step.product.toString().length;
          remainingDigits += num1Digits[currentPosition];
        }
      }
      console.log("difference:", step.difference, "remainingDigits:", remainingDigits);
      currentX = productEndX - step.difference.toString().length * 0.7 * charWidth;// 修正为使用差值的长度

      const differenceWithRemaining = step.difference.toString() + remainingDigits;
      console.log(differenceWithRemaining);
      ctx.fillText(differenceWithRemaining, currentX, currentY);
      currentY += lineHeight;
      g_currentX = currentX;
    });

    // 如果有余数，显示在最后一行
    //if (parseInt(steps.remainder) > 0) {
    //  currentY += lineHeight;  // 确保余数在新的一行显示
    //  ctx.fillText(steps.remainder.toString(), currentX, currentY);
    //}
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
