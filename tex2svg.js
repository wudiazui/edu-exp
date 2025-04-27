// 参考 https://github.com/mathjax/MathJax-demos-node/tree/master/direct
// 使用ES模块语法导入MathJax模块

import {mathjax} from 'mathjax-full/js/mathjax.js';
import {TeX} from 'mathjax-full/js/input/tex.js';
import {SVG} from 'mathjax-full/js/output/svg.js';
import {liteAdaptor} from 'mathjax-full/js/adaptors/liteAdaptor.js';
import {RegisterHTMLHandler} from 'mathjax-full/js/handlers/html.js';
import {AllPackages} from 'mathjax-full/js/input/tex/AllPackages.js';

// 导入字体相关模块 - 只导入主字体模块
import 'mathjax-full/js/output/svg/fonts/tex.js';

// 移除无法找到的字体文件导入，只保留主模块
// 手动引入常用符号字体是不必要的，已经在主模块中包含了

// 创建适配器和处理程序
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

// 创建TeX和SVG处理器
const tex = new TeX({
  packages: AllPackages,
  macros: {
    "\\RR": "\\mathbb{R}",
    "\\NN": "\\mathbb{N}",
    "\\ZZ": "\\mathbb{Z}",
    "\\QQ": "\\mathbb{Q}",
    "\\CC": "\\mathbb{C}"
  }
});

// 创建SVG输出器 - 使用标准选项
const svg = new SVG({
  fontCache: 'local', // 设置为local以便在SVG中包含字形而不是引用
  // 使用默认选项，移除自定义样式设置
  mtextInheritFont: false,
  merrorInheritFont: true
});

// 创建文档对象
const html = mathjax.document('', {InputJax: tex, OutputJax: svg});

// 公式缓存
const mathCache = {};

/**
 * 将TeX公式转换为SVG
 * @param {string} formula - 要转换的TeX公式
 * @param {boolean} display - 是否为显示模式
 * @param {Object} options - 附加选项
 * @returns {string} SVG HTML字符串
 */
export const tex2svg = (formula, display = false, options = {}) => {
  try {
    // 检查缓存
    const cacheKey = `${formula}-${display}`;
    if (mathCache[cacheKey]) {
      return mathCache[cacheKey];
    }

    // 转换选项 - 使用有限的选项集
    const convertOptions = {
      display: display
    };

    // 转换公式
    const node = html.convert(formula, convertOptions);
    
    // 获取SVG HTML
    let svgHtml = adaptor.outerHTML(node);
    
    // 移除外部的mjx-container包裹，提取纯SVG
    svgHtml = extractSvgFromContainer(svgHtml);
    
    // 添加命名空间以确保SVG可以独立使用
    svgHtml = svgHtml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"');
    
    // 添加行内元素样式，确保SVG作为行内元素与文本对齐
    if (!display) {
      // 行内模式，对齐基线
      svgHtml = svgHtml.replace('<svg', '<svg style="display:inline-block; vertical-align:middle; position:relative;"');
    } else {
      // 显示模式（块级），独立一行
      svgHtml = svgHtml.replace('<svg', '<svg style="display:block; margin:1em 0;"');
    }
    
    // 获取已转换的SVG，并确保它可以独立工作
    // 替换所有<use xlink:href="#...">引用，以确保它们能在独立SVG中工作
    svgHtml = fixSvgReferences(svgHtml);
    
    // 缓存结果
    mathCache[cacheKey] = svgHtml;
    
    return svgHtml;
  } catch (error) {
    console.error('Error rendering formula:', error);
    return `<span class="math-tex-error">公式渲染错误: ${formula}</span>`;
  }
};

/**
 * 从MathJax的容器中提取纯SVG元素
 * @param {string} html - 包含mjx-container的HTML字符串
 * @returns {string} 提取出来的纯SVG字符串
 */
function extractSvgFromContainer(html) {
  // 使用正则表达式提取<svg>...</svg>
  const svgMatch = html.match(/<svg[^>]*>[\s\S]*?<\/svg>/);
  
  if (svgMatch) {
    return svgMatch[0];
  }
  
  // 如果没有找到SVG标签，返回原始HTML
  return html;
}

/**
 * 修复SVG中的引用，确保它们可以在独立的SVG中工作
 * @param {string} svgText - 原始SVG文本
 * @returns {string} 修复后的SVG文本
 */
function fixSvgReferences(svgText) {
  // 使用一个随机ID前缀来避免冲突
  const uniquePrefix = `mjx-${Math.random().toString(36).substring(2, 10)}`;
  
  // 为所有ID添加前缀
  let result = svgText.replace(/id="([^"]+)"/g, `id="${uniquePrefix}-$1"`);
  
  // 更新所有使用这些ID的引用
  result = result.replace(/href="#([^"]+)"/g, `href="#${uniquePrefix}-$1"`);
  
  return result;
}

/**
 * 获取转换所需的CSS样式
 * @returns {string} CSS样式文本
 */
export const getStylesheet = () => {
  // 只返回基础MathJax样式，不添加额外自定义样式
  let styles = adaptor.textContent(svg.styleSheet(html));
  
  // 添加基本的行内显示样式
  styles += `
  svg.mjx-svg {
    display: inline-block;
    vertical-align: middle;
    line-height: 0;
  }
  `;
  
  return styles;
};

/**
 * 注入样式表到当前页面
 * @returns {Promise<void>}
 */
export const injectStylesheet = () => {
  return new Promise((resolve, reject) => {
    try {
      const styles = getStylesheet();
      
      // 创建样式元素
      const styleEl = document.createElement('style');
      styleEl.id = 'mathjax-styles';
      styleEl.textContent = styles;
      
      // 检查是否已存在，如果存在则更新内容
      const existingStyle = document.getElementById('mathjax-styles');
      if (existingStyle) {
        existingStyle.textContent = styles;
      } else {
        document.head.appendChild(styleEl);
      }
      
      resolve();
    } catch (error) {
      console.error('无法注入MathJax样式表:', error);
      reject(error);
    }
  });
}; 