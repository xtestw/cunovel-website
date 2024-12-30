import React, { useState } from 'react';
import { js_beautify, html_beautify, css_beautify } from 'js-beautify';
import { format as sqlFormat } from 'sql-formatter';
import './CodeFormatter.css';

const CodeFormatter = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [formattedCode, setFormattedCode] = useState('');
  const [error, setError] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [useTabs, setUseTabs] = useState(false);

  // 支持的语言列表
  const languages = [

    { value: 'sql', label: 'SQL' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'jsx', label: 'JSX/React' },
    { value: 'scss', label: 'SCSS' },
    { value: 'less', label: 'LESS' },
    { value: 'xml', label: 'XML' }
  ];

  // 格式化代码
  const formatCode = () => {
    setError('');
    if (!code.trim()) {
      setError('请输入需要格式化的代码');
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
          result = js_beautify(code, options);
          break;

        case 'json':
          try {
            // 先解析确保是有效的 JSON
            const parsed = JSON.parse(code);
            result = JSON.stringify(parsed, null, useTabs ? '\t' : ' '.repeat(indentSize));
          } catch (e) {
            throw new Error('JSON 语法错误: ' + e.message);
          }
          break;

        case 'html':
        case 'xml':
          result = html_beautify(code, {
            ...options,
            unformatted: ['code', 'pre', 'em', 'strong', 'span']
          });
          break;

        case 'css':
        case 'scss':
        case 'less':
          result = css_beautify(code, {
            ...options,
            newline_between_rules: true,
            selector_separator_newline: true
          });
          break;

        case 'sql':
          // SQL 格式化
          result = sqlFormat(code, {
            language: 'sql',  // 可以是 'sql', 'mysql', 'postgresql' 等
            indent: useTabs ? '\t' : ' '.repeat(indentSize),
            uppercase: true,  // 关键字大写
            linesBetweenQueries: 2  // 查询语句之间的空行数
          });
          break;

        default:
          result = code;
      }

      setFormattedCode(result);
    } catch (e) {
      setError(e.message);
    }
  };

  // 复制格式化后的代码
  const copyCode = () => {
    if (formattedCode) {
      navigator.clipboard.writeText(formattedCode)
        .then(() => {
          // 可以添加复制成功的提示
        })
        .catch(err => {
          setError('复制失败: ' + err.message);
        });
    }
  };

  return (
    <div className="code-formatter">
      <div className="formatter-controls">
        <div className="control-group">
          <label>语言:</label>
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
          <label>缩进大小:</label>
          <input
            type="number"
            min="1"
            max="8"
            value={indentSize}
            onChange={(e) => setIndentSize(Number(e.target.value))}
            disabled={useTabs}
          />
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={useTabs}
              onChange={(e) => setUseTabs(e.target.checked)}
            />
            使用Tab缩进
          </label>
        </div>
      </div>

      <div className="code-panels">
        <div className="code-panel">
          <label>输入代码:</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="在此输入需要格式化的代码..."
            spellCheck="false"
          />
        </div>

        <div className="format-actions">
          <button onClick={formatCode} className="format-button">
            格式化 →
          </button>
          <button onClick={copyCode} className="copy-button" disabled={!formattedCode}>
            复制结果
          </button>
        </div>

        <div className="code-panel">
          <label>格式化结果:</label>
          <textarea
            value={formattedCode}
            readOnly
            spellCheck="false"
            placeholder="格式化后的代码将显示在这里..."
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default CodeFormatter; 