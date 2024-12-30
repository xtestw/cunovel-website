import React, { useState, useEffect } from 'react';
import ReactJson from 'react-json-view';
import { useTranslation } from 'react-i18next';

const JsonFormatter = () => {
  const { t } = useTranslation();
  const [inputJson, setInputJson] = useState('');
  const [outputJson, setOutputJson] = useState(null);
  const [error, setError] = useState('');
  const [errorPosition, setErrorPosition] = useState(null);

  // 解析JSON错误信息，获取错误位置和原因
  const parseJsonError = (error) => {
    const match = error.message.match(/at position (\d+)/);
    const position = match ? parseInt(match[1]) : null;
    
    // 获取错误发生的行号和列号
    if (position !== null) {
      const textBeforeError = inputJson.substring(0, position);
      const lines = textBeforeError.split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      
      // 获取错误上下文
      const errorLines = inputJson.split('\n');
      const startLine = Math.max(0, line - 2);
      const endLine = Math.min(errorLines.length, line + 2);
      const context = errorLines.slice(startLine, endLine).join('\n');
      
      return {
        message: error.message,
        line,
        column,
        context,
        position
      };
    }
    
    return {
      message: error.message,
      line: null,
      column: null,
      context: null,
      position: null
    };
  };

  useEffect(() => {
    try {
      if (inputJson.trim()) {
        const parsed = JSON.parse(inputJson);
        setOutputJson(parsed);
        setError('');
        setErrorPosition(null);
      } else {
        setOutputJson({});
        setError('');
        setErrorPosition(null);
      }
    } catch (e) {
      const errorInfo = parseJsonError(e);
      setError(e.message);
      setErrorPosition(errorInfo);
      setOutputJson(null);
    }
  }, [inputJson]);

  const renderError = () => {
    if (!errorPosition) {
      return <div className="error-message">{error}</div>;
    }

    return (
      <div className="json-error-details">
        <div className="error-header">
          <span className="error-type">{t('jsonFormatter.syntaxError')}</span>
          {errorPosition.line && (
            <span className="error-location">
              {t('jsonFormatter.errorAt', { 
                line: errorPosition.line, 
                column: errorPosition.column 
              })}
            </span>
          )}
        </div>
        <div className="error-message">{error}</div>
        {errorPosition.context && (
          <pre className="error-context">
            <code>{errorPosition.context}</code>
            {errorPosition.column && (
              <div 
                className="error-pointer" 
                style={{ marginLeft: `${errorPosition.column - 1}ch` }}
              >
                ^
              </div>
            )}
          </pre>
        )}
      </div>
    );
  };

  return (
    <div className="json-formatter">
      <div className="json-container">
        <div className="json-input-area">
          <h3>{t('jsonFormatter.title')}</h3>
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder={t('jsonFormatter.placeholder')}
          />
        </div>
        
        <div className="json-button-area">
          <button onClick={() => setInputJson('')}>{t('jsonFormatter.clear')}</button>
        </div>

        <div className="json-output-area">
          <h3>{t('jsonFormatter.formattedOutput')}</h3>
          {error ? (
            renderError()
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

export default JsonFormatter; 