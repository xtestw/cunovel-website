import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import './TextProcessor.css';

const TextProcessor = () => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState('merge');
  const [delimiter, setDelimiter] = useState(',');
  const [replaceFrom, setReplaceFrom] = useState('');
  const [replaceTo, setReplaceTo] = useState('');
  const [useRegex, setUseRegex] = useState(false);

  const handleProcess = () => {
    if (!inputText) return;

    switch (mode) {
      case 'merge':
        const mergedText = inputText
          .split('\n')
          .filter(line => line.trim())
          .join(delimiter);
        setOutputText(mergedText);
        break;

      case 'split':
        try {
          const splitText = inputText
            .split(delimiter)
            .map(item => item.trim())
            .filter(item => item)
            .join('\n');
          setOutputText(splitText);
        } catch (e) {
          setOutputText(t('nav.tools.textProcessor.errors.splitError'));
        }
        break;

      case 'replace':
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
          setOutputText(t('nav.tools.textProcessor.errors.replaceError'));
        }
        break;

      default:
        break;
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('nav.tools.textProcessor.page.title')} | CuTool</title>
        <meta 
          name="description" 
          content={t('nav.tools.textProcessor.page.description')}
        />
        <meta 
          name="keywords" 
          content={t('nav.tools.textProcessor.page.keywords')}
        />
      </Helmet>
      <div className="text-processor-container">
        <div className="mode-selector">
          <button
            className={`mode-button ${mode === 'merge' ? 'active' : ''}`}
            onClick={() => setMode('merge')}
          >
            {t('nav.tools.textProcessor.modes.merge')}
          </button>
          <button
            className={`mode-button ${mode === 'split' ? 'active' : ''}`}
            onClick={() => setMode('split')}
          >
            {t('nav.tools.textProcessor.modes.split')}
          </button>
          <button
            className={`mode-button ${mode === 'replace' ? 'active' : ''}`}
            onClick={() => setMode('replace')}
          >
            {t('nav.tools.textProcessor.modes.replace')}
          </button>
        </div>

        <div className="processor-content">
          <div className="input-section">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === 'merge' ? t('nav.tools.textProcessor.placeholders.merge') :
                mode === 'split' ? t('nav.tools.textProcessor.placeholders.split') :
                t('nav.tools.textProcessor.placeholders.replace')
              }
              className="text-input"
            />
          </div>

          <div className="control-section">
            {(mode === 'merge' || mode === 'split') && (
              <div className="delimiter-input">
                <label>{t('nav.tools.textProcessor.labels.delimiter')}:</label>
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
                  <label>{t('nav.tools.textProcessor.labels.find')}:</label>
                  <input
                    type="text"
                    value={replaceFrom}
                    onChange={(e) => setReplaceFrom(e.target.value)}
                    className="control-input"
                  />
                </div>
                <div className="replace-input">
                  <label>{t('nav.tools.textProcessor.labels.replace')}:</label>
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
                    {t('nav.tools.textProcessor.labels.useRegex')}
                  </label>
                </div>
              </div>
            )}

            <button onClick={handleProcess} className="process-button">
              {t('nav.tools.textProcessor.buttons.process')}
            </button>
          </div>

          <div className="output-section">
            <textarea
              value={outputText}
              readOnly
              placeholder={t('nav.tools.textProcessor.placeholders.output')}
              className="text-output"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default TextProcessor; 