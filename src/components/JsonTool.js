import React, { useState } from 'react';
import ReactJson from 'react-json-view';

const JsonTool = () => {
  const [inputJson, setInputJson] = useState('');
  const [outputJson, setOutputJson] = useState(null);
  const [error, setError] = useState('');

  const formatJson = () => {
    try {
      const parsed = inputJson ? JSON.parse(inputJson) : {};
      setOutputJson(parsed);
      setError('');
    } catch (e) {
      setError('Invalid JSON format');
    }
  };

  return (
    <div className="tool-component">
      <div className="json-container">
        <div className="json-input-area">
          <h3>输入 JSON</h3>
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder="请输入 JSON 字符串..."
          />
        </div>
        
        <div className="json-button-area">
          <button onClick={formatJson}>格式化 &gt;</button>
        </div>

        <div className="json-output-area">
          <h3>格式化后的 JSON</h3>
          {error ? (
            <div className="error-message">{error}</div>
          ) : (
            <ReactJson 
              src={outputJson || {}}
              theme="rjv-default"
              style={{
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid #d9d9d9',
                backgroundColor: '#fafafa',
                height: '100%',
                overflow: 'auto'
              }}
              displayDataTypes={false}
              name={false}
              enableClipboard={true}
              collapsed={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonTool; 