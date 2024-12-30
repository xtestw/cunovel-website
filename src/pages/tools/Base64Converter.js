import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

function Base64Converter() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const encodeToBase64 = () => {
    try {
      const encoded = btoa(input);
      setOutput(encoded);
    } catch (e) {
      setOutput(t('nav.tools.base64.errors.encode'));
    }
  };

  const decodeFromBase64 = () => {
    try {
      const decoded = atob(input);
      setOutput(decoded);
    } catch (e) {
      setOutput(t('nav.tools.base64.errors.decode'));
    }
  };

  return (
    <div className="tool-component">
      <h2>{t('nav.tools.base64.title')}</h2>
      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('nav.tools.base64.input.placeholder')}
          rows="4"
        />
      </div>
      <div className="button-group">
        <button onClick={encodeToBase64}>
          {t('nav.tools.base64.buttons.encode')}
        </button>
        <button onClick={decodeFromBase64}>
          {t('nav.tools.base64.buttons.decode')}
        </button>
      </div>
      <div className="output-area">
        <h3>{t('nav.tools.base64.output.title')}</h3>
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