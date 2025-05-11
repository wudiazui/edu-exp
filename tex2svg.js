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
import {AssistiveMmlHandler} from 'mathjax-full/js/a11y/assistive-mml.js';
import {AllPackages} from 'mathjax-full/js/input/tex/AllPackages.js';

// 导入字体相关模块 - 只导入主字体模块
import 'mathjax-full/js/output/svg/fonts/tex.js';

// 移除无法找到的字体文件导入，只保留主模块
// 手动引入常用符号字体是不必要的，已经在主模块中包含了

// 最小化的CSS样式，用于独立SVG图像
const CSS = [
  'svg a{fill:blue;stroke:blue}',
  '[data-mml-node="merror"]>g{fill:red;stroke:red}',
  '[data-mml-node="merror"]>rect[data-background]{fill:yellow;stroke:none}',
  '[data-frame],[data-line]{stroke-width:70px;fill:none}',
  '.mjx-dashed{stroke-dasharray:140}',
  '.mjx-dotted{stroke-linecap:round;stroke-dasharray:0,140}',
  'use[data-c]{stroke-width:3px}'
].join('');

// 创建适配器和处理程序
const adaptor = liteAdaptor();
const handler = RegisterHTMLHandler(adaptor);

// 可选：启用无障碍MathML处理程序
// 如果需要无障碍支持，可以取消下面这行的注释
// AssistiveMmlHandler(handler);

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

/**
 * 将TeX公式转换为SVG
 * @param {string} formula - 要转换的TeX公式
 * @param {boolean} display - 是否为显示模式
 * @param {Object} options - 附加选项
 * @returns {string} SVG HTML字符串
 */
export const tex2svg = (formula, display = false, options = {}) => {
  try {

    // 转换选项 - 传递所有选项
    const convertOptions = {
      display: display,
      ...options  // 包含用户提供的所有选项
    };

    // 转换公式
    const node = html.convert(formula, convertOptions);

    // 获取SVG HTML - 可以选择是否包含容器
    let svgHtml = adaptor.outerHTML(node);
    svgHtml = extractSvgFromContainer(svgHtml);
    
    // 始终包含CSS样式
    // 在SVG的defs中添加CSS样式
    svgHtml = svgHtml.replace(/<defs>/, `<defs><style>${CSS}</style>`);

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

    // 直接返回结果，不再缓存

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
