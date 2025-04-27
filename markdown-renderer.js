import { tex2svg } from "./tex2svg.js";

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
    let processedMarkdown = markdown.replace(/\$(.+?)\$/g, (match, expression) => {
      const placeholder = `MATH_PLACEHOLDER_${mathExpressions.length}`;
      mathExpressions.push(expression);
      mathPlaceholders.push(placeholder);
      return placeholder;
    });
    
    // Replace display math expressions ($$...$$) with placeholders
    processedMarkdown = processedMarkdown.replace(/\$\$(.+?)\$\$/g, (match, expression) => {
      const placeholder = `DISPLAY_MATH_PLACEHOLDER_${displayMathExpressions.length}`;
      displayMathExpressions.push(expression);
      displayMathPlaceholders.push(placeholder);
      return placeholder;
    });
    
    // Use marked to render markdown
    const marked = (await import('marked')).marked;
    
    // Configure marked options
    marked.setOptions({
      gfm: true,
      breaks: true,
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
      try {
        const svgHtml = tex2svg(expression, false);
        html = html.replace(mathPlaceholders[i], svgHtml);
      } catch (error) {
        console.error('Error rendering inline math:', error);
        html = html.replace(mathPlaceholders[i], `<span class="math-tex-error">公式渲染错误: ${expression}</span>`);
      }
    }
    
    // Process each display math expression
    for (let i = 0; i < displayMathExpressions.length; i++) {
      const expression = displayMathExpressions[i];
      try {
        const svgHtml = tex2svg(expression, true);
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