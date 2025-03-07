/**
 * Multiplication operations module
 */

import { checkPoint, trimZero, addStrings } from '../utils/stringUtils.js';

/**
 * 乘法竖式计算
 * @param {string} factor1 - 乘数1
 * @param {string} factor2 - 乘数2
 * @returns {object} 包含乘积与计算过程的对象
 */
function multiplicationVertical(factor1, factor2) {
    // 预处理输入
    factor1 = trimZero(factor1);
    factor2 = trimZero(factor2);
    
    // 计算乘法
    let result = calculateMultiplication(factor1, factor2);
    
    // 返回计算结果和过程
    return {
        factor1: factor1,
        factor2: factor2,
        product: result.product,
        steps: result.steps
    };
}

/**
 * 计算乘法
 * @param {string} factor1 - 乘数1
 * @param {string} factor2 - 乘数2
 * @returns {object} 包含乘积和计算步骤的对象
 */
function calculateMultiplication(factor1, factor2) {
    // 处理小数点
    let dot_pos1 = checkPoint(factor1, 0);
    let dot_pos2 = checkPoint(factor2, 0);
    
    // 计算小数点位置
    let decimal_places = 0;
    if (dot_pos1 != -1) {
        decimal_places += (factor1.length - dot_pos1 - 1);
    }
    if (dot_pos2 != -1) {
        decimal_places += (factor2.length - dot_pos2 - 1);
    }
    
    // 移除小数点进行计算
    let f1 = factor1.replace(".", "");
    let f2 = factor2.replace(".", "");
    
    // 计算步骤
    let steps = [];
    
    // 从右向左逐位计算
    for (let i = f2.length - 1; i >= 0; i--) {
        let digit = parseInt(f2[i]);
        let carry = 0;
        let partialProduct = "";
        
        // 计算当前位的部分积
        for (let j = f1.length - 1; j >= 0; j--) {
            let product = digit * parseInt(f1[j]) + carry;
            carry = Math.floor(product / 10);
            partialProduct = (product % 10) + partialProduct;
        }
        
        if (carry > 0) {
            partialProduct = carry + partialProduct;
        }
        
        // 根据位置添加末尾的零
        let position = f2.length - 1 - i;
        let displayProduct = partialProduct;
        
        // 只有当不是最低位时才添加零
        if (position > 0) {
            for (let k = 0; k < position; k++) {
                displayProduct += "0";
            }
        }
        
        // 处理部分积中的小数点
        if (decimal_places > 0) {
            let len = displayProduct.length;
            if (decimal_places >= len) {
                displayProduct = "0." + "0".repeat(decimal_places - len) + displayProduct;
            } else {
                displayProduct = displayProduct.substring(0, len - decimal_places) + "." + displayProduct.substring(len - decimal_places);
            }
        }
        
        // 记录步骤
        steps.push({
            multiplicand: factor1,
            multiplier_digit: f2[i],
            partial_product: displayProduct,
            position: position
        });
    }
    
    // 计算最终结果
    let product = "0";
    for (let i = 0; i < steps.length; i++) {
        // 对于加法，需要移除小数点再计算
        let partialWithoutDot = steps[i].partial_product.replace(".", "");
        product = addStrings(product, partialWithoutDot);
    }
    
    // 处理最终结果中的小数点
    if (decimal_places > 0) {
        let len = product.length;
        if (decimal_places >= len) {
            product = "0." + "0".repeat(decimal_places - len) + product;
        } else {
            product = product.substring(0, len - decimal_places) + "." + product.substring(len - decimal_places);
        }
    }
    
    return {
        product: trimZero(product),
        steps: steps
    };
}

export {
    multiplicationVertical,
    calculateMultiplication
}; 