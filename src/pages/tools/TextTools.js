import React, { useState } from 'react';

function TextTools() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const countChars = () => {
    setOutput(`字符数：${input.length}`);
  };

  const countLines = () => {
    const lines = input.split('\n');
    setOutput(`行数：${lines.length}`);
  };

  const toUpperCase = () => {
    setOutput(input.toUpperCase());
  };

  const toLowerCase = () => {
    setOutput(input.toLowerCase());
  };

  const removeSpaces = () => {
    setOutput(input.replace(/\s+/g, ''));
  };

  return (
    <div className="tool-component">
      <h2>文本工具</h2>
      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="请输入文本"
          rows="4"
        />
      </div>
      <div className="button-group">
        <button onClick={countChars}>字符统计</button>
        <button onClick={countLines}>行数统计</button>
        <button onClick={toUpperCase}>转大写</button>
        <button onClick={toLowerCase}>转小写</button>
        <button onClick={removeSpaces}>去除空格</button>
      </div>
      <div className="output-area">
        <h3>结果：</h3>
        <textarea
          value={output}
          readOnly
          rows="4"
        />
      </div>
    </div>
  );
}

export default TextTools; 