export function math2img(expr) {
  let url = encodeURI(`/edushop/tiku/submit/genexprpic?expr=${expr}`);

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
    '\\.': '。',
    ',': '，',
    '\\?': '？',
    '!': '！',
    ':': '：',
    ';': '；',
    //'\\(': '（',
    //'\\)': '）',
    //'\\[': '【',
    //'\\]': '】',
    //'\\{': '｛',
    //'\\}': '｝',
    //'-': '—', // 使用中文长破折号
    //'"': '"', // 使用中文双引号
   // "'": ''', // 使用中文单引号
  };

  let result = text;
  for (const [englishPunctuation, chinesePunctuation] of Object.entries(punctuationMap)) {
    result = result.replace(new RegExp(englishPunctuation, 'g'), chinesePunctuation);
  }

  return result;
}


export async function topic_formt(text) {
  try {
    const response = await fetch('http://127.0.0.1:8000/topic/formt', {
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

export async function topic_answer(text) {
  try {
    const response = await fetch('http://127.0.0.1:8000/topic/answer', {
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

export async function topic_analysis(text) {
  try {
    const response = await fetch('http://127.0.0.1:8000/topic/analysis', {
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
    const expression = match[1];
    const imgElement = await math2img(expression);
    result = result.replace(fullMatch, imgElement.outerHTML);
  }

  return result;
}
