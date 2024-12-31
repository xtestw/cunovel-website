import React, { useState } from 'react';
import './UrlConverter.css';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';

const UrlConverter = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [standard, setStandard] = useState('RFC2396');
  const [params, setParams] = useState({});

  const encodeValue = (value) => {
    if (standard === 'RFC2396') {
      return encodeURIComponent(value);
    } else {
      return value
        .split('')
        .map(char => {
          if (char === ' ') return '+';
          if (/[a-zA-Z0-9\-_.!~*'()]/.test(char)) return char;
          const code = char.charCodeAt(0).toString(16).toUpperCase();
          return `%${code.padStart(2, '0')}`;
        })
        .join('');
    }
  };

  const decodeValue = (value) => {
    try {
      if (standard === 'RFC2396') {
        return decodeURIComponent(value);
      } else {
        return value.replace(/\+/g, ' ');
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
      setOutput(t('nav.tools.urlConverter.params.error'));
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
      setParams({ error: t('nav.tools.urlConverter.params.error') });
    }
  };

  return (
    <>
      <Helmet>
        <title>URL编码转换工具 | CuTool</title>
        <meta name="description" content="在线URL编码解码工具,支持参数提取和RFC标准转换" />
        <meta name="keywords" content="URL编码,URL解码,URL参数,在线工具" />
      </Helmet>
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
          {t('nav.tools.urlConverter.standards.note')} {
            standard === 'RFC1738' ? 
              t('nav.tools.urlConverter.standards.rfc1738') : 
              t('nav.tools.urlConverter.standards.rfc2396')
          }
        </div>
        <div className="converter-layout">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('nav.tools.urlConverter.input.placeholder')}
            className="converter-input"
          />
          <div className="operation-buttons">
            <button onClick={() => handleOperation('encode')} className="operation-button">
              {t('nav.tools.urlConverter.buttons.encode')}
            </button>
            <button onClick={() => handleOperation('decode')} className="operation-button">
              {t('nav.tools.urlConverter.buttons.decode')}
            </button>
            <button onClick={extractParams} className="operation-button extract">
              {t('nav.tools.urlConverter.buttons.extract')}
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            className="converter-output"
            placeholder={t('nav.tools.urlConverter.output.placeholder')}
          />
        </div>
        {Object.keys(params).length > 0 && (
          <div className="params-section">
            <h3>{t('nav.tools.urlConverter.params.title')}</h3>
            <table className="params-table">
              <thead>
                <tr>
                  <th>{t('nav.tools.urlConverter.params.table.name')}</th>
                  <th>{t('nav.tools.urlConverter.params.table.value')}</th>
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
    </>
  );
};

export default UrlConverter; 