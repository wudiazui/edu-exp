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
