import React from "react";

function Select(){
  return (<label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">选择题型</span>
            </div>
            <select className="select select-bordered">
              <option selected>问答</option>
              <option>单选</option>
              <option>填空</option>
            </select>
          </label>)
}

function CopyButton({ text }) {
  const handleCopy = () => {
    if (text) {
      navigator.clipboard.writeText(text)
        .then(() => {
          // 可以添加一个提示复制成功
          console.log('Copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy:', err);
        });
    }
  };

  return (
    <button
      className="btn btn-sm btn-ghost"
      onClick={handleCopy}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
      </svg>
    </button>
  );
}

export default function Main() {
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [analysis, setAnalysis] = React.useState('');

  React.useEffect(() => {
    // 监听来自 background 的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SET_QUESTION') {
        setQuestion(message.data);
      }
    });
  }, []);

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleFormat = () => {
    chrome.runtime.sendMessage(
      { type: 'FORMAT_QUESTION', data: question },
      (response) => {
        if (response && response.formatted) {
          setQuestion(response.formatted);
        }
      }
    );
  };

  const handleGenerateAnswer = () => {
    chrome.runtime.sendMessage(
      { type: 'TOPIC_ANSWER', data: question },
      (response) => {
        if (response && response.formatted) {
          setAnswer(response.formatted);
        }
      }
    );
  };

  const handleGenerateAnalysis = () => {
    chrome.runtime.sendMessage(
      { type: 'TOPIC_ANALYSIS', data: question },
      (response) => {
        if (response && response.formatted) {
          setAnalysis(response.formatted);
        }
      }
    );
  };

  return (<div className="container max-auto">
            <div className="card bg-base-100 shadow-xl w-full mt-2">
              <div className="card-body">
                <div className="label flex justify-between items-center">
                  <span className="label-text">题干</span>
                  <CopyButton text={question} />
                </div>
                <textarea
                  value={question}
                  onChange={handleQuestionChange}
                  placeholder="题干"
                  className="textarea textarea-bordered textarea-lg w-full max-w-xs"></textarea>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl w-full mt-2">
              <div className="card-body flex flex-col items-center">
                <Select />
                <div className="join m-2">
                  <button
                    className="btn join-item"
                    onClick={handleFormat}
                  >整理题干</button>
                  <button className="btn join-item" onClick={handleGenerateAnswer}>
                    生成解答
                  </button>
                  <button className="btn join-item" onClick={handleGenerateAnalysis}>
                    生成解析
                  </button>
                </div>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl w-full mt-2">
              <div className="card-body">
                <div className="label flex justify-between items-center">
                  <span className="label-text">解答</span>
                  <CopyButton text={answer} />
                </div>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="解答"
                  className="textarea textarea-bordered textarea-lg w-full max-w-xs"></textarea>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl w-full mt-2">
              <div className="card-body">
                <div className="label flex justify-between items-center">
                  <span className="label-text">解析</span>
                  <CopyButton text={analysis} />
                </div>
                <textarea
                  value={analysis}
                  onChange={(e) => setAnalysis(e.target.value)}
                  placeholder="解析"
                  className="textarea textarea-bordered textarea-lg w-full max-w-xs"></textarea>
              </div>
            </div>
          </div>)
}
