/**
 * Replaces specific text patterns in the input string
 * 
 * @param {string} text - Input text to process
 * @returns {string} Processed text
 */
function replaceText(text) {
    const replacements = [
        ["乘以", "乘"], 
        ["\\\\\\(", "$"], 
        ["\\\\\\)", "$"]
    ];
    
    let result = text;
    for (const [from, to] of replacements) {
        result = result.replace(new RegExp(from, 'g'), to);
    }
    
    return result;
}

/**
 * Converts markdown text to plain text by removing formatting
 * 
 * @param {string} text - Input markdown text
 * @returns {string} Plain text without formatting
 */
function convertToPlainText(text) {
    const regexes = {
        headings: /#+\s/g,
        emphasis: /\*\*?(.*?)\*\*?/g,
        codeBlocks: /```[\s\S]*?```/g,
        inlineCode: /`([^`]+)`/g,
        links: /\[([^\]]+)\]\([^\)]+\)/g,
        listMarkers: /^[ \t]*[-*+]\s/gm,  // Fixed multiline regex
        stepLabels: /步骤[一二三四五六七八九十]+：|第[一二三四五六七八九十]+步：/g
    };

    let result = text;

    // Remove headings
    result = result.replace(regexes.headings, '');

    // Remove bold and italic (capture group 1 contains the text without formatting)
    result = result.replace(regexes.emphasis, '$1');

    // Remove code blocks
    result = result.replace(regexes.codeBlocks, '');

    // Remove inline code (capture group 1 contains the code without backticks)
    result = result.replace(regexes.inlineCode, '$1');

    // Remove links (capture group 1 contains the link text)
    result = result.replace(regexes.links, '$1');

    // Remove list markers
    result = result.replace(regexes.listMarkers, '');

    // Remove step labels
    result = result.replace(regexes.stepLabels, '');

    return result.trim();
}

/**
 * Processes a single line containing equations
 * 
 * @param {string} line - Input line with equations
 * @returns {string} Processed line with equations
 */
function processEquationLine(line) {
    const segments = [];
    let currentPos = 0;

    // Find all equations and text segments
    while (currentPos < line.length) {
        const startOffset = line.indexOf('$', currentPos);
        if (startOffset !== -1) {
            // Add text before equation
            if (startOffset > currentPos) {
                segments.push({type: 'text', content: line.slice(currentPos, startOffset)});
            }

            const endOffset = line.indexOf('$', startOffset + 1);
            if (endOffset !== -1) {
                const equation = line.slice(startOffset + 1, endOffset);
                
                // Check for \begin, preserve if present
                if (equation.includes('\\begin')) {
                    segments.push({type: 'preserve', content: equation});
                } else {
                    // Count equals
                    const equalsCount = (equation.match(/=/g) || []).length;
                    segments.push({type: 'equation', content: equation, equalsCount});
                }

                currentPos = endOffset + 1;
            } else {
                // No closing $, treat rest as text
                segments.push({type: 'text', content: line.slice(currentPos)});
                currentPos = line.length;
            }
        } else {
            // No more $, treat rest as text
            segments.push({type: 'text', content: line.slice(currentPos)});
            currentPos = line.length;
        }
    }

    const result = [];
    let currentLine = '';

    for (const segment of segments) {
        switch (segment.type) {
            case 'text':
                currentLine += segment.content;
                break;
            case 'preserve':
                currentLine += `$${segment.content}$`;
                break;
            case 'equation':
                if (segment.equalsCount > 1) {
                    const parts = segment.content.split('=');
                    
                    // First part to current line
                    currentLine += `$${parts[0]}$`;
                    result.push(currentLine);
                    currentLine = '';

                    // Remaining parts as new lines
                    for (let i = 1; i < parts.length; i++) {
                        const part = parts[i];
                        if (part.startsWith(' ')) {
                            result.push(`$= ${part.trim()}$`);
                        } else {
                            result.push(`$=${part}$`);
                        }
                    }
                } else {
                    currentLine += `$${segment.content}$`;
                }
                break;
        }
    }

    // Add last line if not empty
    if (currentLine) {
        result.push(currentLine);
    }

    // Combine lines if possible
    if (result.length > 1) {
        for (let i = 0; i < result.length - 1;) {
            if (result[i].endsWith('$') && !result[i + 1].trimStart().startsWith('$')) {
                result[i] += result[i + 1];
                result.splice(i + 1, 1);
            } else {
                i++;
            }
        }
    }

    return result.join('\n');
}

/**
 * Formats equations by breaking lines with multiple equality signs
 * 
 * @param {string} inputText - Input text with equations
 * @returns {string} Formatted text with equations processed
 */
function formatEquations(inputText) {
    return inputText
        .split('\n')
        .map(processEquationLine)
        .join('\n');
}

/**
 * Removes empty lines from a string after converting it to plain text
 * 
 * @param {string} text - Input text
 * @returns {string} Text with empty lines removed
 */
function removeEmptyLinesFromString(text) {
    const plainText = convertToPlainText(text);
    const replacedText = replaceText(plainText);
    const formattedText = formatEquations(replacedText);
    
    return formattedText
        .split('\n')
        .filter(line => line.trim() !== '')
        .join('\n');
}

// Export functions for use in other modules
export {
    replaceText,
    convertToPlainText,
    formatEquations,
    processEquationLine,
    removeEmptyLinesFromString
};
