// 正确检测当前运行环境
const getGlobalObject = () => {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof self !== 'undefined') return self;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  // 在service_worker环境中创建一个空对象作为全局对象
  return {};
};

// 获取当前环境的全局对象
const globalObject = getGlobalObject();

// 确保有document对象
if (typeof document === 'undefined') {
  globalObject.document = {
    createElement: () => ({
      style: {},
      setAttribute: () => {},
      appendChild: () => {},
      getElementsByTagName: () => []
    }),
    createElementNS: () => ({
      setAttribute: () => {},
      appendChild: () => {}
    }),
    head: {
      appendChild: () => {}
    },
    body: {
      appendChild: () => {}
    },
    createTextNode: () => ({}),
    documentElement: {
      appendChild: () => {}
    }
  };
}

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

    // 如果在service worker环境中，直接返回简单的HTML表示
    if (typeof window === 'undefined' && typeof document === 'undefined' && typeof self !== 'undefined') {
      console.warn('在Service Worker环境中，无法完全渲染SVG，返回简化版本');
      const escapedFormula = escapeHtml(formula);
      const simpleHtml = `<span class="ql-mathjax" latex="${escapedFormula}" mathid="service-worker" tabindex="-1">
        <span contenteditable="false">${display ? '\\[' + escapedFormula + '\\]' : '$' + escapedFormula + '$'}</span>
      </span>`;
      mathCache[cacheKey] = simpleHtml;
      return simpleHtml;
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

    // 增强内联样式，添加更多必要的样式规则
    const enhancedStyle = `
      display: inline-block;
      vertical-align: middle;
      position: relative;
      font: normal 1em/1 'MJXc-TeX-math-I',Times New Roman,serif;
      line-height: 0;
      text-indent: 0;
      text-align: center;
      text-transform: none;
      letter-spacing: normal;
      word-wrap: normal;
      word-spacing: normal;
      white-space: nowrap;
      direction: ltr;
      ${display ? 'margin: 1em 0;' : ''}
    `;

    // 应用增强的内联样式
    if (!display) {
      // 行内模式，对齐基线
      svgHtml = svgHtml.replace('<svg', '<svg style="display:inline-block; vertical-align:middle; position:relative;"');
    } else {
      // 显示模式（块级），独立一行
      svgHtml = svgHtml.replace('<svg', '<svg style="display:inline-block; vertical-align:middle; position:relative;"');
    }

    // 获取已转换的SVG，并确保它可以独立工作
    // 替换所有<use xlink:href="#...">引用，以确保它们能在独立SVG中工作
    svgHtml = fixSvgReferences(svgHtml);

    // 创建完整的HTML结构，包含LaTeX源码和渲染的SVG
    const htmlStructure = `<span class="ql-mathjax" latex="${escapeHtml(formula)}" mathid="undefined" tabindex="-1" style="display: inline-block; vertical-align: middle;">&#xFEFF;<span contenteditable="false">${svgHtml}</span>&#xFEFF;</span>`;

    // 缓存结果
    mathCache[cacheKey] = htmlStructure;

    return htmlStructure;
  } catch (error) {
    console.error('Error rendering formula:', error);
    // 错误情况下也返回完整的HTML结构
    return `<span class="ql-mathjax" latex="${escapeHtml(formula)}" mathid="error" tabindex="-1"><span contenteditable="false">公式渲染错误: ${formula}</span></span>`;
  }
};

/**
 * 转义HTML特殊字符，防止XSS攻击
 * @param {string} text - 需要转义的文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
