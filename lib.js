export function math2img(expr) {
  let url = `/edushop/tiku/submit/genexprpic?expr=${encodeURIComponent(expr)}`;

  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const img = document.createElement('img');
      img.src = data.data.url;
      img.style = `width: ${data.data.width}px;height: ${data.data.height}px;`;
      img.setAttribute("data-math", data.data.exprEncode);
      img.setAttribute("data-width", data.data.width);
      img.setAttribute("data-height", data.data.height);
      return img;
    })
    .catch(error => {
      console.error(error);
      return null;
    });
}

export async function img_upload(imageBlob) {
  const url = "/edushop/tiku/submit/uploadpic";

  const formData = new FormData();
  formData.append('file', imageBlob, 'math.png');

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

export async function getAuditTaskLabel(taskType = 'audittask') {
  const url = `/edushop/question/${taskType}/getlabel`;

  try {
    const response = await fetch(url, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting audit task label:', error);
    throw error;
  }
}

export async function getAuditTaskList({
  pn = 1,
  rn = 20,
  clueID = '',
  clueType = 1,
  step = 1,
  subject = 2,
  taskType = 'audittask'
} = {}) {
  try {
    const queryParams = new URLSearchParams({
      pn,
      rn,
      clueID,
      clueType,
      step,
      subject
    });

    const response = await fetch(`/edushop/question/${taskType}/list?${queryParams}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching audit task list:', error);
    throw error;
  }
}

export async function claimAuditTask(taskIDs, taskType = 'audittask') {
  const commitType = taskType === 'producetask' ? 'producetaskcommit' : 'audittaskcommit';
  try {
    const requestBody = taskType === 'producetask' 
      ? { clueIDs: taskIDs }
      : { taskIDs };

    const response = await fetch(`/edushop/question/${commitType}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error claiming audit task:', error);
    throw error;
  }
}


export function replacePunctuation(text) {
  const punctuationMap = {
    '\\.$': '。',
    ',': '，',
    '\\?': '？',
    '!': '！',
    ':$': '：',
    //'：': ':',
    ';': '；',
    //'\\(': '（',
    //'\\（': '(',
    //'\\）': ')',
    //'\\)': '）',
    //'\\[': '【',
    //'\\]': '】',
    //'\\{': '｛',
    //'\\}': '｝',
    //'-': '—', // 使用中文长破折号
    '"': '"', // 使用中文双引号
    // "'": ''', // 使用中文单引号
  };

  // 匹配数学表达式的正则
  const mathRegex = /\$([^$]+)\$/g;

  // 将文本中的数学表达式提取出来
  const mathExpressions = [];
  text = text.replace(mathRegex, (match) => {
    mathExpressions.push(match);
    return `{{math${mathExpressions.length - 1}}}`; // 用占位符替换
  });

  // 去除行内字符之间的多余空格，但保留每行前后的空格
  text = text.replace(/ +/g, ''); // 将多个空格替换为一个空格

  let result = text;
  for (const [englishPunctuation, chinesePunctuation] of Object.entries(punctuationMap)) {
    result = result.replace(new RegExp(englishPunctuation, 'g'), chinesePunctuation);
  }


  result = result.replace(/\(\)/g, '（ ）');
  result = result.replace(/（）/g, '（ ）');
  // 处理单个字符的情况，包括字母，排除括号内有运算符的情况
  result = result.replace(/\(([0-9a-zA-Z\u4e00-\u9fa5])\)(?![0-9])(?![+\-*/])/g, '（$1）');
  // 处理多个字符的情况，包括字母
  result = result.replace(/\(([\u4e00-\u9fa5a-zA-Z]+)\)/g, '（$1）');
  // 处理括号内数字和中文混合的情况，如(3分)
  result = result.replace(/\((\d+[\u4e00-\u9fa5]+)\)/g, '（$1）');
  result = result.replace(/\(([\u4e00-\u9fa5]+\d+)\)/g, '（$1）');
  result = result.replace(/\((\d+[\u4e00-\u9fa5]+\d+)\)/g, '（$1）');
  // 处理字符前后带括号的情况，排除括号内有运算符的情况
  result = result.replace(/([\u4e00-\u9fa5a-zA-Z]+)\(([^+\-*/]+?)\)/g, '$1（$2）');
  // 处理序号格式，即使后面跟着数字也会替换
  result = result.replace(/\((\d+)\)(?=\d)(?![+\-*/])/g, '（$1）');
  result = result.replace(/([^+\-*/]):/g, '$1：');
  result = result.replace(/(?<=[\u4e00-\u9fa5])\:(?=[\u4e00-\u9fa5])/g, '：');
  result = result.replace(/(?<=[)）])\:/g, '：');


  // 将占位符替换回原来的数学表达式
  mathExpressions.forEach((expr, index) => {
    result = result.replace(`{{math${index}}}`, expr);
  });

  return result;
}


export async function run_llm(host, uname, item, data) {
  try {
    const response = await fetch(`${host}/llm/run/${item}`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData.topic;
  } catch (error) {
    console.error('Error formatting topic:', error);
    return null;
  }
}

export function run_llm_stream(host, uname, item, data, onChunk, onError, onComplete) {
  try {
    const controller = new AbortController();
    const { signal } = controller;
    
    fetch(`${host}/llm/run/${item}/stream`, {
      method: 'POST',
      headers: {
        'accept': 'text/event-stream',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
      body: JSON.stringify(data),
      signal
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      function processStream() {
        return reader.read().then(({ done, value }) => {
          if (done) {
            if (onComplete) {
              onComplete();
            }
            return;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          
          // Process SSE format (data: messages)
          const lines = chunk.split('\n');
          lines.forEach(line => {
            if (line.startsWith('data:')) {
              try {
                const eventData = line.slice(5).trim();
                if (eventData && onChunk) {
                  onChunk(eventData);
                }
              } catch (e) {
                if (onError) onError(e);
              }
            }
          });
          
          return processStream();
        }).catch(err => {
          if (onError) {
            onError(err);
          } else {
            console.error('Stream error:', err);
          }
        });
      }
      
      return processStream();
    })
    .catch(error => {
      if (onError) {
        onError(error);
      } else {
        console.error('Fetch error:', error);
      }
    });
    
    return controller; // Return controller so caller can abort if needed
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      console.error('Error in run_llm_stream:', error);
    }
    return null;
  }
}

export async function format_latex(host, uname, text) {
  try {
    const response = await fetch(`${host}/llm/format_latex`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData.topic;
  } catch (error) {
    console.error('Error formatting LaTeX:', error);
    return null;
  }
}

export async function topic_type_list(host, uname, discipline) {
  try {
    const queryParams = new URLSearchParams();
    if (discipline) {
      queryParams.append('discipline', discipline);
    }
    const queryString = queryParams.toString();
    const url = `${host}/llm/topic_type_list${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error formatting topic:', error);
    return null;
  }
}

export async function discipline_list(host, uname) {
  try {
    const response = await fetch(`${host}/llm/discipline_list`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error getting discipline list:', error);
    return null;
  }
}

export async function user_info(host, uname) {
  try {
    const response = await fetch(`${host}/user/info`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error formatting topic:', error);
    return null;
  }
}


export async function reset_fingerprint(host, uname) {
  try {
    const response = await fetch(`${host}/fingerprint/reset`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error reset fingerprint:', error);
    return null;
  }
}

export async function ocr_text(image_data, host, uname) {
  try {
    const response = await fetch(`${host}/llm/ocr`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
      body: JSON.stringify(image_data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error ocr:', error);
    return null;
  }
}

export async function topic_split(text_data, host, uname) {
  try {
    const response = await fetch(`${host}/llm/topic_split`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
      body: JSON.stringify(text_data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Return the full data object instead of just topics
    // This allows the component to access both text and list fields
    return data;
  } catch (error) {
    console.error('Error topic split:', error);
    return null;
  }
}

export function content_review(text, host, uname, onMessage, onError, onComplete) {
  try {
    const controller = new AbortController();
    const signal = controller.signal;

    fetch(`${host}/llm/content_review`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      },
      body: JSON.stringify({ text }),
      signal: signal
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      function processStream() {
        return reader.read().then(({ value, done }) => {
          if (done) {
            if (onComplete) onComplete();
            return;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          
          // Process SSE format (data: messages)
          const lines = chunk.split('\n');
          lines.forEach(line => {
            if (line.startsWith('data:')) {
              try {
                const eventData = line.slice(5).trim();
                if (eventData && onMessage) {
                  onMessage(eventData);
                }
              } catch (e) {
                if (onError) onError(e);
              }
            }
          });
          
          return processStream();
        });
      }
      
      return processStream();
    }).catch(error => {
      console.error('Error in content review:', error);
      if (onError) onError(error);
    });
    
    // Return abort controller to allow cancellation
    return controller;
  } catch (error) {
    console.error('Error setting up content review:', error);
    if (onError) onError(error);
    return null;
  }
}

export async function replaceLatexWithImages(text) {
   console.log("replaceLatexWithImages:\n",text);
  // Convert \( and \) to $
  text = text.replace(/\\\(/g, '$').replace(/\\\)/g, '$')
    .replace(/\\\[/g, '$').replace(/\\\]/g, '$');

  // 使用 dotAll 标志 (s) 来匹配包括换行符在内的任意字符
  // [^$]*? 使用非贪婪匹配，避免跨越多个数学表达式
  const regex = /\$([\s\S]*?)\$/g;
  let result = text;
  const matches = [...text.matchAll(regex)];

  for (const match of matches) {
    const fullMatch = match[0];
    let expression = match[1];
    
    // 清理表达式：移除首尾的空白字符（包括换行符）
    expression = expression.trim();
    
    // 替换 HTML 符号为文本符号
    expression = expression
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&copy;/g, '©')
      .replace(/&reg;/g, '®')
      .replace(/&euro;/g, '€')
      .replace(/&yen;/g, '¥')
      .replace(/<\/span>/g,'')
      .replace(/<span>/g, '')
      .replace(/<br>/g, '');
    
    const imgElement = await math2img(expression);
    result = result.replace(fullMatch, imgElement.outerHTML);
  }

  return result;
}

export async function replaceLatexWithImagesInHtml(htmlText) {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlText;

  // First, try to process the entire content as a whole to handle cross-element LaTeX
  const fullTextContent = tempDiv.textContent || tempDiv.innerText || '';
  
  // Convert \( and \) to $, \[ and \] to $
  let processedFullText = fullTextContent.replace(/\\\(/g, '$').replace(/\\\)/g, '$')
    .replace(/\\\[/g, '$').replace(/\\\]/g, '$');

  // Check if there are cross-element LaTeX expressions
  const regex = /\$([\s\S]*?)\$/g;
  const crossElementMatches = [...processedFullText.matchAll(regex)];
  
  if (crossElementMatches.length > 0) {
    // Found cross-element LaTeX, process the entire HTML as text first
    let processedHtml = htmlText;
    
    // Convert \( and \) to $, \[ and \] to $ in the raw HTML
    processedHtml = processedHtml.replace(/\\\(/g, '$').replace(/\\\)/g, '$')
      .replace(/\\\[/g, '$').replace(/\\\]/g, '$');
    
    // Find LaTeX expressions in the HTML, allowing for HTML tags in between
    // This regex allows HTML tags between the $ delimiters
    const htmlLatexRegex = /\$(((?!<script|<style)[^$]|<[^>]*>)*?)\$/gs;
    const htmlMatches = [...processedHtml.matchAll(htmlLatexRegex)];
    
    for (const match of htmlMatches) {
      const fullMatch = match[0];
      let expression = match[1];
      
      // Remove HTML tags from the expression but preserve the math content
      expression = expression
        .replace(/<br\s*\/?>/gi, ' ')          // Replace <br> with space
        .replace(/<\/p>\s*<p[^>]*>/gi, ' ')    // Replace </p><p> with space
        .replace(/<[^>]*>/g, '')               // Remove all other HTML tags
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&copy;/g, '©')
        .replace(/&reg;/g, '®')
        .replace(/&euro;/g, '€')
        .replace(/&yen;/g, '¥');
      
      // Clean up the expression
      expression = expression.trim();
      
      // Skip empty expressions
      if (!expression) continue;
      
      // Get the image element
      const imgElement = await math2img(expression);
      if (imgElement) {
        // Replace the entire LaTeX block (including HTML tags) with the image
        processedHtml = processedHtml.replace(fullMatch, imgElement.outerHTML);
      }
    }
    
    return processedHtml;
  }
  
  // No cross-element LaTeX found, use the original element-by-element processing
  // Function to get all text content from an element, preserving the structure for LaTeX detection
  function getElementTextContent(element) {
    let textContent = '';
    
    function traverse(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        textContent += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // For br tags, add a space to separate text nodes
        if (node.tagName === 'BR') {
          textContent += ' ';
        }
        // Traverse child nodes
        for (let child of node.childNodes) {
          traverse(child);
        }
      }
    }
    
    traverse(element);
    return textContent;
  }

  // Function to process an element that might contain LaTeX
  async function processElement(element) {
    // Skip script and style elements
    if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
      return;
    }

    // Get the combined text content
    const textContent = getElementTextContent(element);
    
    // Convert \( and \) to $, \[ and \] to $
    let processedText = textContent.replace(/\\\(/g, '$').replace(/\\\)/g, '$')
      .replace(/\\\[/g, '$').replace(/\\\]/g, '$');

    // 使用 [\s\S]*? 来匹配包括换行符在内的任意字符，使用非贪婪匹配
    const regex = /\$([\s\S]*?)\$/g;
    const matches = [...processedText.matchAll(regex)];

    if (matches.length === 0) {
      // No LaTeX found, process child elements recursively
      const childElements = Array.from(element.children);
      for (const childElement of childElements) {
        await processElement(childElement);
      }
      return;
    }

    // Found LaTeX, replace the entire element content
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    for (const match of matches) {
      const fullMatch = match[0];
      let expression = match[1];

      // 清理表达式：移除首尾的空白字符，但保留内部的空白和换行
      expression = expression.trim();

      // Replace HTML entities
      expression = expression
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&copy;/g, '©')
        .replace(/&reg;/g, '®')
        .replace(/&euro;/g, '€')
        .replace(/&yen;/g, '¥');

      // Add text before the LaTeX
      if (match.index > lastIndex) {
        const beforeText = processedText.slice(lastIndex, match.index);
        if (beforeText.trim()) {
          fragment.appendChild(document.createTextNode(beforeText));
        }
      }

      // Get and append the image
      const imgElement = await math2img(expression);
      if (imgElement) {
        fragment.appendChild(imgElement);
      }

      lastIndex = match.index + fullMatch.length;
    }

    // Add remaining text after the last LaTeX
    if (lastIndex < processedText.length) {
      const afterText = processedText.slice(lastIndex);
      if (afterText.trim()) {
        fragment.appendChild(document.createTextNode(afterText));
      }
    }

    // Replace the element's content with the processed fragment
    element.innerHTML = '';
    element.appendChild(fragment);
  }

  // Process all direct child elements
  const childElements = Array.from(tempDiv.children);
  for (const childElement of childElements) {
    await processElement(childElement);
  }

  // Return the processed HTML
  return tempDiv.innerHTML;
}
