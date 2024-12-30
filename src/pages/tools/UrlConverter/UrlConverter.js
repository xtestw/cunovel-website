import React, { useState } from 'react';
import './UrlConverter.css';

const UrlConverter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [standard, setStandard] = useState('RFC2396');
  const [params, setParams] = useState({});

  // 编码单个参数值
  const encodeValue = (value) => {
    if (standard === 'RFC2396') {
      return encodeURIComponent(value);
    } else {
      // RFC1738 编码规则
      return value
        .split('')
        .map(char => {
          if (char === ' ') return '+';  // 空格编码为 +
          if (/[a-zA-Z0-9\-_.!~*'()]/.test(char)) return char;  // 保留这些字符不编码
          const code = char.charCodeAt(0).toString(16).toUpperCase();
          return `%${code.padStart(2, '0')}`;
        })
        .join('');
    }
  };

  // 解码单个参数值
  const decodeValue = (value) => {
    try {
      if (standard === 'RFC2396') {
        return decodeURIComponent(value);
      } else {
        // RFC1738 解码规则
        return value.replace(/\+/g, ' ');  // 只需要将 + 转换回空格
      }
    } catch (e) {
      return value;
    }
  };

  const handleOperation = (mode) => {
    try {
      let baseUrl = '';
      let paramsString = input;

      if (input.includes('?')) {
        const [urlPart, params] = input.split('?');
        baseUrl = urlPart;
        paramsString = params;
      }

      const paramPairs = paramsString.split('&').filter(pair => pair.length > 0);
      const processedPairs = paramPairs.map(pair => {
        const [key, value] = pair.split('=');
        if (!value) return key;
        
        const processedValue = mode === 'encode' ? 
          encodeValue(value) : 
          decodeValue(value);
        
        return `${key}=${processedValue}`;
      });

      const processedParamsString = processedPairs.join('&');
      setOutput(baseUrl ? 
        `${baseUrl}?${processedParamsString}` : 
        processedParamsString);
    } catch (e) {
      setOutput('Error: Invalid input');
    }
  };

  const extractParams = () => {
    try {
      let paramsString = input;
      if (input.includes('?')) {
        paramsString = input.split('?')[1];
      }

      const paramPairs = paramsString.split('&').filter(pair => pair.length > 0);
      const paramsObj = {};

      paramPairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
          paramsObj[key] = value ? decodeValue(value) : '';
        }
      });

      setParams(paramsObj);
    } catch (e) {
      setParams({ error: '无效的URL或参数' });
    }
  };

  return (
    <div className="url-converter-container">
      <div className="standard-selector">
        <button 
          className={`standard-button ${standard === 'RFC2396' ? 'active' : ''}`}
          onClick={() => setStandard('RFC2396')}
        >
          RFC2396
        </button>
        <button 
          className={`standard-button ${standard === 'RFC1738' ? 'active' : ''}`}
          onClick={() => setStandard('RFC1738')}
        >
          RFC1738
        </button>
      </div>
      <div className="standard-note">
        注意: {standard === 'RFC1738' ? 
          "RFC1738 使用 '+' 编码空格" : 
          "RFC2396 使用 '%20' 编码空格"}
      </div>
      <div className="converter-layout">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入需要编码/解码的URL或参数，例如: http://example.com?key=value 或 key=value"
          className="converter-input"
        />
        <div className="operation-buttons">
          <button onClick={() => handleOperation('encode')} className="operation-button">
            编码 →
          </button>
          <button onClick={() => handleOperation('decode')} className="operation-button">
           解码 →
          </button>
          <button onClick={extractParams} className="operation-button extract">
            提取参数
          </button>
        </div>
        <textarea
          value={output}
          readOnly
          className="converter-output"
          placeholder="转换结果将显示在这里..."
        />
      </div>
      {Object.keys(params).length > 0 && (
        <div className="params-section">
          <h3>URL参数列表:</h3>
          <table className="params-table">
            <thead>
              <tr>
                <th>参数名</th>
                <th>参数值</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(params).map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UrlConverter; 