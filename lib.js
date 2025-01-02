export function math2img(expr) {
  console.log("math2img_expr: ", expr)
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


export function replacePunctuation(text) {
  const punctuationMap = {
    '\\.$': '。',
    ',': '，',
    '\\?': '？',
    '!': '！',
    ':$': '：',
    '：': ':',
    ';': '；',
    '\\(': '（',
    //'\\（': '(',
    //'\\）': ')',
    '\\)': '）',
    //'\\[': '【',
    //'\\]': '】',
    //'\\{': '｛',
    //'\\}': '｝',
    //'-': '—', // 使用中文长破折号
    //'"': '"', // 使用中文双引号
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

  let result = text;
  for (const [englishPunctuation, chinesePunctuation] of Object.entries(punctuationMap)) {
    result = result.replace(new RegExp(englishPunctuation, 'g'), chinesePunctuation);
  }

  // 将占位符替换回原来的数学表达式
  mathExpressions.forEach((expr, index) => {
    result = result.replace(`{{math${index}}}`, expr);
  });

  return result;
}


export async function topic_formt(text, host) {
  try {
    const response = await fetch(`${host}/topic/formt`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.topic;
  } catch (error) {
    console.error('Error formatting topic:', error);
    return null;
  }
}

export async function topic_answer(text, host) {
  try {
    const response = await fetch(`${host}/topic/answer`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.topic;
  } catch (error) {
    console.error('Error formatting topic:', error);
    return null;
  }
}

export async function topic_analysis(text, host) {
  try {
    const response = await fetch(`${host}/topic/analysis`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.topic;
  } catch (error) {
    console.error('Error formatting topic:', error);
    return null;
  }
}

export async function text_format(text, host) {
  try {
    const response = await fetch(`${host}/text/format`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.topic;
  } catch (error) {
    console.error('Error formatting topic:', error);
    return null;
  }
}

export async function replaceLatexWithImages(text) {
  const regex = /\$([^$]+)\$/g;
  let result = text;
  const matches = [...text.matchAll(regex)];

  for (const match of matches) {
    const fullMatch = match[0];
    let expression = match[1];
    console.log(fullMatch, expression)
    console.log(match)
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
        .replace(/&yen;/g, '¥');
    const imgElement = await math2img(expression);
    result = result.replace(fullMatch, imgElement.outerHTML);
  }

  return result;
}
