
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

export default function Main() {
  return (<div className="container max-auto">
            <div className="w-full p-2">
              <div className="label">
                <span className="label-text">题干</span>
              </div>
              <textarea
                    placeholder="题干"
                    className="textarea textarea-bordered textarea-lg w-full max-w-xs "></textarea>
                </div>
                <div className="w-full p-2">
                  <Select />
                  <div class="join m-2 w-full">
                    <button class="btn join-item">生成解答</button>
                    <button class="btn join-item">生成解析</button>
                  </div>
                </div>
            <div className="w-full p-2">
              <p>解答</p>
              <textarea
                placeholder="解答"
                className="textarea textarea-bordered textarea-lg w-full max-w-xs "></textarea>
              </div>
              <div className="w-full p-2">
                <p>解析</p>
                <textarea
                  placeholder="解析"
                  className="textarea textarea-bordered textarea-lg w-full max-w-xs "></textarea>
            </div>
            </div>)
}
