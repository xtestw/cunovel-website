import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import ReactJson from 'react-json-view';
import { useTranslation } from 'react-i18next';
import './JsonFormatter.css';

const JsonFormatter = () => {
  const { t, i18n } = useTranslation();
  const [inputJson, setInputJson] = useState('');
  const [outputJson, setOutputJson] = useState(null);
  const [error, setError] = useState('');
  const [errorPosition, setErrorPosition] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCompressed, setIsCompressed] = useState(false);

  useEffect(() => {
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

  // 修改复制功能
  const handleCopy = () => {
    if (outputJson) {
      navigator.clipboard.writeText(JSON.stringify(outputJson, null, 2))
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000); // 2秒后隐藏提示
        })
        .catch(err => {
          console.error('复制失败:', err);
        });
    }
  };

  // 修改压缩功能
  const handleCompress = () => {
    if (outputJson) {
      if (isCompressed) {
        // 如果已经是压缩状态，则格式化显示
        setInputJson(JSON.stringify(outputJson, null, 2));
      } else {
        // 如果是格式化状态，则压缩显示
        setInputJson(JSON.stringify(outputJson));
      }
      setIsCompressed(!isCompressed);
    }
  };

  return (
    <>
      <Helmet>
        <title>JSON 格式化工具 | JSON Formatter - CUTool</title>
        <meta name="description" content="在线 JSON 格式化工具，支持 JSON 美化、压缩、验证和错误提示。Online JSON formatter tool with beautification, compression, validation and error highlighting." />
        <meta name="keywords" content="JSON formatter, JSON validator, JSON beautifier, JSON 格式化, JSON 校验" />
      </Helmet>
      
      <div className="json-formatter">
        <div className="json-container">
          <div className="json-input-area">
            {/* <h3>{t('jsonFormatter.title')}</h3> */}
            <textarea
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              placeholder={t('jsonFormatter.placeholder')}
            />
          </div>

          <div className="json-output-area">
            <div className="output-header">
              {/* <h3>{t('jsonFormatter.formattedOutput.title')}</h3> */}
              <div className="output-actions">
                <button onClick={() => setInputJson('')} className="action-button">
                  <span className="action-icon">🗑️</span>
                  {t('jsonFormatter.clear')}
                </button>
                <button 
                  onClick={handleCopy} 
                  className={`action-button ${copySuccess ? 'copy-success' : ''}`}
                >
                  <span className="action-icon">
                    {copySuccess ? '✓' : '📋'}
                  </span>
                  {copySuccess ? t('jsonFormatter.messages.copySuccess') : t('jsonFormatter.copy')}
                </button>
                <button 
                  onClick={handleCompress} 
                  className={`action-button ${isCompressed ? 'active' : ''}`}
                >
                  <span className="action-icon">📦</span>
                  {isCompressed ? t('jsonFormatter.format') : t('jsonFormatter.minify')}
                </button>
                <button 
                  onClick={() => setIsCollapsed(!isCollapsed)} 
                  className="action-button"
                >
                  <span className="action-icon">{isCollapsed ? '📖' : '📚'}</span>
                  {isCollapsed ? t('jsonFormatter.actions.expand') : t('jsonFormatter.actions.collapse')}
                </button>
              </div>
            </div>
            {error ? (
              renderError()
            ) : (
              <ReactJson 
                src={outputJson || {}}
                theme="rjv-default"
                style={{
                    lineNumbers: 'visible', // 确保行号可见

                  padding: '12px',
                  borderRadius: '0px 0px 4px 4px',
                  border: '1px solid #d9d9d9',
                  backgroundColor: '#fafafa',
                  height: '100%',
                  overflow: 'auto',
                  fontFamily: 'Monaco, monospace',
                  fontSize: '14px',
                }}
                displayDataTypes={false}
                name={false}
                enableClipboard={true}
                collapsed={isCollapsed}
                displayLineNumbers={true}
                iconStyle="square"
                indentWidth={4}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default JsonFormatter; 