import React, { useState, useEffect } from 'react';
import './RegexMatcher.css';

const RegexMatcher = () => {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [selectedFlags, setSelectedFlags] = useState(['g']);

  const flagOptions = [
    { value: 'g', label: '全局匹配', desc: '查找所有匹配项而非在找到第一个匹配后停止' },
    { value: 'i', label: '忽略大小写', desc: '使匹配不区分大小写' },
    { value: 'm', label: '多行匹配', desc: '使 ^ 和 $ 匹配每一行的开始和结束' },
    { value: 's', label: '点号匹配换行', desc: '允许 . 匹配换行符' },
    { value: 'u', label: 'Unicode', desc: '使用Unicode模式进行匹配' },
    { value: 'y', label: '粘性匹配', desc: '仅匹配目标字符串中此正则表达式的lastIndex属性指示的索引处的匹配项' }
  ];

  const presets = {
    email: {
      pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      description: '匹配电子邮件地址'
    },
    phone: {
      pattern: '(?:(?:\\+|00)86)?1[3-9]\\d{9}',
      description: '匹配中国大陆手机号'
    },
    url: {
      pattern: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)',
      description: '匹配URL地址'
    },
    date: {
      pattern: '\\d{4}[-/年](0?[1-9]|1[012])[-/月](0?[1-9]|[12][0-9]|3[01])日?',
      description: '匹配日期（YYYY-MM-DD或YYYY年MM月DD日）'
    },
    ipv4: {
      pattern: '(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
      description: '匹配IPv4地址'
    }
  };

  useEffect(() => {
    if (selectedPreset) {
      setPattern(presets[selectedPreset].pattern);
    }
  }, [selectedPreset]);

  const handleMatch = () => {
    setError('');
    setMatches([]);
    
    if (!pattern || !text) {
      setError('请输入正则表达式和待匹配文本');
      return;
    }

    try {
      const regex = new RegExp(pattern, selectedFlags.join(''));
      const results = [];
      let match;

      if (flags.includes('g')) {
        while ((match = regex.exec(text)) !== null) {
          results.push({
            value: match[0],
            index: match.index,
            groups: match.slice(1)
          });
        }
      } else {
        match = regex.exec(text);
        if (match) {
          results.push({
            value: match[0],
            index: match.index,
            groups: match.slice(1)
          });
        }
      }

      setMatches(results);
    } catch (e) {
      setError(e.message);
    }
  };

  const highlightText = () => {
    if (!matches.length || !text) return text;

    let lastIndex = 0;
    const parts = [];
    
    matches.forEach((match, i) => {
      // 添加不匹配的部分
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${i}`}>
            {text.slice(lastIndex, match.index)}
          </span>
        );
      }
      
      // 添加匹配的部分
      parts.push(
        <span key={`match-${i}`} className="highlight">
          {match.value}
        </span>
      );
      
      lastIndex = match.index + match.value.length;
    });
    
    // 添加最后剩余的文本
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-end">
          {text.slice(lastIndex)}
        </span>
      );
    }
    
    return <div className="highlighted-text">{parts}</div>;
  };

  return (
    <div className="regex-matcher">
      <div className="regex-panel">
        <div className="left-panel">
          <div className="input-section">
            <label>正则表达式:</label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="输入正则表达式"
            />
          </div>

          <div className="flags-section">
            <label>正则标志:</label>
            <div className="flags-selector">
              {flagOptions.map(({ value, label, desc }) => (
                <label key={value} className="flag-option" title={desc}>
                  <input
                    type="checkbox"
                    checked={selectedFlags.includes(value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFlags([...selectedFlags, value]);
                      } else {
                        setSelectedFlags(selectedFlags.filter(f => f !== value));
                      }
                    }}
                  />
                  <span className="flag-label">{label} ({value})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="text-input">
            <label>待匹配文本:</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入要匹配的文本"
            />
          </div>
        </div>

        <div className="right-panel">
          <div className="presets-section">
            <label>常用模式:</label>
            <select 
              value={selectedPreset} 
              onChange={(e) => setSelectedPreset(e.target.value)}
            >
              <option value="">选择预设模式</option>
              {Object.entries(presets).map(([key, { description }]) => (
                <option key={key} value={key}>
                  {description}
                </option>
              ))}
            </select>
          </div>

          <button onClick={handleMatch} className="match-button">
            执行匹配
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="results-panel">
        <div className="highlighted-content">
          <label>匹配结果 ({matches.length} 个匹配):</label>
          {highlightText()}
        </div>

        {matches.length > 0 && (
          <div className="matches-list">
            <label>详细匹配信息:</label>
            <div className="matches-container">
              {matches.map((match, index) => (
                <div key={index} className="match-item">
                  <div>匹配 #{index + 1}</div>
                  <div>值: {match.value}</div>
                  <div>位置: {match.index}</div>
                  {match.groups.length > 0 && (
                    <div>
                      捕获组: 
                      {match.groups.map((group, i) => (
                        <span key={i} className="group">
                          {group}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegexMatcher; 