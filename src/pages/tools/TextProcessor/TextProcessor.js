import React, { useState } from 'react';
import './TextProcessor.css';

const TextProcessor = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState('merge'); // merge, split, replace
  const [delimiter, setDelimiter] = useState(',');
  const [replaceFrom, setReplaceFrom] = useState('');
  const [replaceTo, setReplaceTo] = useState('');
  const [useRegex, setUseRegex] = useState(false);

  const handleProcess = () => {
    if (!inputText) return;

    switch (mode) {
      case 'merge':
        // 多行合并为一行
        const mergedText = inputText
          .split('\n')
          .filter(line => line.trim())
          .join(delimiter);
        setOutputText(mergedText);
        break;

      case 'split':
        // 一行拆分为多行
        try {
          const splitText = inputText
            .split(delimiter)
            .map(item => item.trim())
            .filter(item => item)
            .join('\n');
          setOutputText(splitText);
        } catch (e) {
          setOutputText('分割错误，请检查分隔符');
        }
        break;

      case 'replace':
        // 文本替换
        try {
          let replacedText;
          if (useRegex) {
            const regex = new RegExp(replaceFrom, 'g');
            replacedText = inputText.replace(regex, replaceTo);
          } else {
            replacedText = inputText.split(replaceFrom).join(replaceTo);
          }
          setOutputText(replacedText);
        } catch (e) {
          setOutputText('替换错误，请检查输入');
        }
        break;

      default:
        break;
    }
  };

  return (
    <div className="text-processor-container">
      <div className="mode-selector">
        <button
          className={`mode-button ${mode === 'merge' ? 'active' : ''}`}
          onClick={() => setMode('merge')}
        >
          多行合并
        </button>
        <button
          className={`mode-button ${mode === 'split' ? 'active' : ''}`}
          onClick={() => setMode('split')}
        >
          文本分割
        </button>
        <button
          className={`mode-button ${mode === 'replace' ? 'active' : ''}`}
          onClick={() => setMode('replace')}
        >
          文本替换
        </button>
      </div>

      <div className="processor-content">
        <div className="input-section">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === 'merge' ? "输入多行文本，将被合并为一行" :
              mode === 'split' ? "输入要分割的文本" :
              "输入要替换的文本"
            }
            className="text-input"
          />
        </div>

        <div className="control-section">
          {(mode === 'merge' || mode === 'split') && (
            <div className="delimiter-input">
              <label>分隔符:</label>
              <input
                type="text"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="control-input"
              />
            </div>
          )}

          {mode === 'replace' && (
            <div className="replace-controls">
              <div className="replace-input">
                <label>查找:</label>
                <input
                  type="text"
                  value={replaceFrom}
                  onChange={(e) => setReplaceFrom(e.target.value)}
                  className="control-input"
                />
              </div>
              <div className="replace-input">
                <label>替换为:</label>
                <input
                  type="text"
                  value={replaceTo}
                  onChange={(e) => setReplaceTo(e.target.value)}
                  className="control-input"
                />
              </div>
              <div className="regex-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={useRegex}
                    onChange={(e) => setUseRegex(e.target.checked)}
                  />
                  使用正则表达式
                </label>
              </div>
            </div>
          )}

          <button onClick={handleProcess} className="process-button">
            处理
          </button>
        </div>

        <div className="output-section">
          <textarea
            value={outputText}
            readOnly
            placeholder="处理结果将显示在这里"
            className="text-output"
          />
        </div>
      </div>
    </div>
  );
};

export default TextProcessor; 