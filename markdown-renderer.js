import { tex2svg } from "./tex2svg.js";

/**
 * 简单包装tex2svg函数，添加错误处理
 * @param {string} tex - TeX公式
 * @param {boolean} display - 是否为显示模式
 * @returns {string} - 渲染后的HTML，或错误信息
 */
const safeRenderTeX = (tex, display) => {
  try {
    return tex2svg(tex, display);
  } catch (error) {
    console.error('TeX渲染错误:', error);
    return `<span class="math-tex-error" style="color:red;font-family:monospace;white-space:pre">${tex}</span>`;
  }
};

/**
 * Renders markdown with math expressions to HTML
 * @param {string} markdown - The markdown text to render
 * @returns {Promise<string>} - HTML string with rendered math
 */
export const renderMarkdownWithMath = async (markdown) => {
  try {
    // First, identify and store math expressions
    const mathExpressions = [];
    const mathPlaceholders = [];
    const displayMathExpressions = [];
    const displayMathPlaceholders = [];

    // Replace inline math expressions ($...$) with placeholders
    let processedMarkdown = markdown.replace(/\$([\s\S]+?)\$/g, (match, expression) => {
      const placeholder = `MATH_PLACEHOLDER_${mathExpressions.length}`;
      mathExpressions.push(expression);
      mathPlaceholders.push(placeholder);
      return placeholder;
    });

    // Replace display math expressions (\[...\]) with placeholders
    processedMarkdown = processedMarkdown.replace(/\\\[([\s\S]+?)\\\]/g, (match, expression) => {
      const placeholder = `DISPLAY_MATH_PLACEHOLDER_${displayMathExpressions.length}`;
      displayMathExpressions.push(expression);
      displayMathPlaceholders.push(placeholder);
      return placeholder;
    });

    // Replace \(...\) style math expressions with placeholders
    processedMarkdown = processedMarkdown.replace(/\\\(([\s\S]+?)\\\)/g, (match, expression) => {
      const placeholder = `MATH_PLACEHOLDER_${mathExpressions.length}`;
      mathExpressions.push(expression);
      mathPlaceholders.push(placeholder);
      return placeholder;
    });

    // Use marked to render markdown
    const marked = (await import('marked')).marked;
    marked.use({
      renderer: {
        list(token){
          const ordered = token.ordered;
          const start = token.start;
      
          let body = '';
          for (let j = 0; j < token.items.length; j++) {
            const item = token.items[j];
            body += this.listitem(item);
          }
      
          const type = 'ol';
          const startAttr = (ordered && start !== 1) ? (' start="' + start + '"') : '';
          return '<' + type + startAttr + '>' + body + '</' + type + '>';
        },
        listitem(item){
          let itemBody = '';
          if (item.task) {
            const checkbox = this.checkbox({ checked: !!item.checked });
            if (item.loose) {
              if (item.tokens[0]?.type === 'paragraph') {
                item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;
                if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === 'text') {
                  item.tokens[0].tokens[0].text = checkbox + ' ' + escape(item.tokens[0].tokens[0].text);
                  item.tokens[0].tokens[0].escaped = true;
                }
              } else {
                item.tokens.unshift({
                  type: 'text',
                  raw: checkbox + ' ',
                  text: checkbox + ' ',
                  escaped: true,
                });
              }
            } else {
              itemBody += checkbox + ' ';
            }
          }
      
          itemBody += this.parser.parse(item.tokens, !!item.loose);
          
          // Skip rendering if itemBody is empty
          if (!itemBody || itemBody.trim() === '') {
            return '';
          }
      
          return `<li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>${itemBody}</li>`;
        },
        strong(text){
          return `<span class="tkspec-bold-normal">${text.text}</span>`;
        }
      }
    });
    // Configure marked options
    marked.setOptions({
      gfm: false,
      breaks: false,
      sanitize: false,
      smartLists: true,
      smartypants: false,
      xhtml: false
    });

    // Render markdown without math expressions
    let html = marked(processedMarkdown);

    // If no math expressions, return HTML directly
    if (mathExpressions.length === 0 && displayMathExpressions.length === 0) return html;

    // Process each inline math expression
    for (let i = 0; i < mathExpressions.length; i++) {
      const expression = mathExpressions[i];
      // Skip empty expressions
      if (!expression || expression.trim() === '') {
        html = html.replace(mathPlaceholders[i], '');
        continue;
      }
      try {
        const svgHtml = safeRenderTeX(expression, false);
        html = html.replace(mathPlaceholders[i], svgHtml);
      } catch (error) {
        console.error('Error rendering inline math:', error);
        html = html.replace(mathPlaceholders[i], `<span class="math-tex-error">公式渲染错误: ${expression}</span>`);
      }
    }

    // Process each display math expression
    for (let i = 0; i < displayMathExpressions.length; i++) {
      const expression = displayMathExpressions[i];
      // Skip empty expressions
      if (!expression || expression.trim() === '') {
        html = html.replace(displayMathPlaceholders[i], '');
        continue;
      }
      try {
        const svgHtml = safeRenderTeX(expression, true);
        html = html.replace(displayMathPlaceholders[i], svgHtml);
      } catch (error) {
        console.error('Error rendering display math:', error);
        html = html.replace(displayMathPlaceholders[i], `<span class="math-tex-error">公式渲染错误: ${expression}</span>`);
      }
    }

    return html;
  } catch (error) {
    console.error('Failed to render markdown with math:', error);
    return markdown; // Return original content as fallback
  }
}; 