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
            if (onComplete) onComplete();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          lines.forEach(line => {
            if (line.startsWith('data:')) {
              try {
                const eventData = line.slice(5).trim();
                if (eventData && onChunk) onChunk(eventData);
              } catch (e) {
                if (onError) onError(e);
              }
            }
          });

          return processStream();
        }).catch(err => {
          if (onError) onError(err); else console.error('Stream error:', err);
        });
      }

      return processStream();
    })
    .catch(error => {
      if (onError) onError(error); else console.error('Fetch error:', error);
    });

    return controller;
  } catch (error) {
    if (onError) onError(error); else console.error('Error in run_llm_stream:', error);
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
    if (discipline) queryParams.append('discipline', discipline);
    const queryString = queryParams.toString();
    const url = `${host}/llm/topic_type_list${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pfy-Key': uname
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting topic type list:', error);
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
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
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
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting user info:', error);
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
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
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
