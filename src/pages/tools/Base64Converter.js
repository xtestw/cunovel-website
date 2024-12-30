import React, { useState } from 'react';

function Base64Converter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const encodeToBase64 = () => {
    try {
      const encoded = btoa(input);
      setOutput(encoded);
    } catch (e) {
      setOutput('编码错误，请检查输入');
    }
  };

  const decodeFromBase64 = () => {
    try {
      const decoded = atob(input);
      setOutput(decoded);
    } catch (e) {
      setOutput('解码错误，请检查输入');
    }
  };

  return (
    <div className="tool-component">
      <h2>Base64 转换</h2>
      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="请输入要转换的文本"
          rows="4"
        />
      </div>
      <div className="button-group">
        <button onClick={encodeToBase64}>编码</button>
        <button onClick={decodeFromBase64}>解码</button>
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

export default Base64Converter; 