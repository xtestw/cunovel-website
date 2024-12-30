import React, { useState } from 'react';
import { js as jsBeautify, css as cssBeautify, html as htmlBeautify } from 'js-beautify';
import { format as sqlFormat } from 'sql-formatter';
import './CodeFormatter.css';
import { useTranslation } from 'react-i18next';

const CodeFormatter = () => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [formattedCode, setFormattedCode] = useState('');
  const [error, setError] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [useTabs, setUseTabs] = useState(false);

  const languages = [
    { value: 'sql', label: t('nav.tools.codeFormatter.language.options.sql') },
    { value: 'javascript', label: t('nav.tools.codeFormatter.language.options.javascript') },
    { value: 'html', label: t('nav.tools.codeFormatter.language.options.html') },
    { value: 'css', label: t('nav.tools.codeFormatter.language.options.css') },
    { value: 'json', label: t('nav.tools.codeFormatter.language.options.json') },
    { value: 'typescript', label: t('nav.tools.codeFormatter.language.options.typescript') },
    { value: 'jsx', label: t('nav.tools.codeFormatter.language.options.jsx') },
    { value: 'scss', label: t('nav.tools.codeFormatter.language.options.scss') },
    { value: 'less', label: t('nav.tools.codeFormatter.language.options.less') },
    { value: 'xml', label: t('nav.tools.codeFormatter.language.options.xml') }
  ];

  const formatCode = () => {
    setError('');
    if (!code.trim()) {
      setError(t('nav.tools.codeFormatter.errors.emptyInput'));
      return;
    }

    try {
      let result = '';
      const options = {
        indent_size: useTabs ? 1 : indentSize,
        indent_char: useTabs ? '\t' : ' ',
        max_preserve_newlines: 2,
        preserve_newlines: true,
        keep_array_indentation: false,
        break_chained_methods: false,
        indent_scripts: 'normal',
        brace_style: 'collapse',
        space_before_conditional: true,
        unescape_strings: false,
        jslint_happy: false,
        end_with_newline: true,
        wrap_line_length: 0,
        indent_inner_html: true,
        comma_first: false,
        e4x: true,
        indent_empty_lines: false
      };
      
      switch (language) {
        case 'javascript':
        case 'typescript':
        case 'jsx':
          try {
            result = jsBeautify(code, options);
          } catch (e) {
            throw new Error(t('nav.tools.codeFormatter.errors.javascript') + e.message);
          }
          break;

        case 'json':
          try {
            const parsed = JSON.parse(code);
            result = JSON.stringify(parsed, null, useTabs ? '\t' : ' '.repeat(indentSize));
          } catch (e) {
            throw new Error(t('nav.tools.codeFormatter.errors.json') + e.message);
          }
          break;

        case 'html':
        case 'xml':
          try {
            result = htmlBeautify(code, {
              ...options,
              unformatted: ['code', 'pre', 'em', 'strong', 'span']
            });
          } catch (e) {
            throw new Error(t('nav.tools.codeFormatter.errors.html') + e.message);
          }
          break;

        case 'css':
        case 'scss':
        case 'less':
          try {
            result = cssBeautify(code, {
              ...options,
              newline_between_rules: true,
              selector_separator_newline: true
            });
          } catch (e) {
            throw new Error(t('nav.tools.codeFormatter.errors.css') + e.message);
          }
          break;

        case 'sql':
          try {
            result = sqlFormat(code, {
              language: 'sql',
              indent: useTabs ? '\t' : ' '.repeat(indentSize),
              uppercase: true,
              linesBetweenQueries: 2
            });
          } catch (e) {
            throw new Error(t('nav.tools.codeFormatter.errors.sql') + e.message);
          }
          break;

        default:
          result = code;
      }

      setFormattedCode(result);
    } catch (e) {
      setError(e.message);
    }
  };

  const copyCode = () => {
    if (formattedCode) {
      navigator.clipboard.writeText(formattedCode)
        .catch(err => {
          setError(t('nav.tools.codeFormatter.errors.copyFailed') + err.message);
        });
    }
  };

  return (
    <div className="code-formatter">
      <div className="formatter-controls">
        <div className="control-group">
          <label>{t('nav.tools.codeFormatter.language.label')}</label>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>{t('nav.tools.codeFormatter.indentSize.label')}</label>
          <input
            type="number"
            min="1"
            max="8"
            value={indentSize}
            onChange={(e) => setIndentSize(Number(e.target.value))}
            disabled={useTabs}
            title={useTabs ? t('nav.tools.codeFormatter.indentSize.disabled') : ''}
          />
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={useTabs}
              onChange={(e) => setUseTabs(e.target.checked)}
            />
            {t('nav.tools.codeFormatter.useTabs.label')}
          </label>
        </div>
      </div>

      <div className="code-panels">
        <div className="code-panel">
          <label>{t('nav.tools.codeFormatter.input.label')}</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('nav.tools.codeFormatter.input.placeholder')}
            spellCheck="false"
          />
        </div>

        <div className="format-actions">
          <button onClick={formatCode} className="format-button">
            {t('nav.tools.codeFormatter.buttons.format')}
          </button>
          <button onClick={copyCode} className="copy-button" disabled={!formattedCode}>
            {t('nav.tools.codeFormatter.buttons.copy')}
          </button>
        </div>

        <div className="code-panel">
          <label>{t('nav.tools.codeFormatter.output.label')}</label>
          <textarea
            value={formattedCode}
            readOnly
            spellCheck="false"
            placeholder={t('nav.tools.codeFormatter.output.placeholder')}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default CodeFormatter; 