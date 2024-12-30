import React, { useState, useEffect } from 'react';
import './RegexMatcher.css';
import { useTranslation } from 'react-i18next';

const RegexMatcher = () => {
  const { t } = useTranslation();
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [selectedFlags, setSelectedFlags] = useState(['g']);

  const flagOptions = [
    { value: 'g', label: t('nav.tools.regexMatcher.flags.options.g.label'), desc: t('nav.tools.regexMatcher.flags.options.g.desc') },
    { value: 'i', label: t('nav.tools.regexMatcher.flags.options.i.label'), desc: t('nav.tools.regexMatcher.flags.options.i.desc') },
    { value: 'm', label: t('nav.tools.regexMatcher.flags.options.m.label'), desc: t('nav.tools.regexMatcher.flags.options.m.desc') },
    { value: 's', label: t('nav.tools.regexMatcher.flags.options.s.label'), desc: t('nav.tools.regexMatcher.flags.options.s.desc') },
    { value: 'u', label: t('nav.tools.regexMatcher.flags.options.u.label'), desc: t('nav.tools.regexMatcher.flags.options.u.desc') },
    { value: 'y', label: t('nav.tools.regexMatcher.flags.options.y.label'), desc: t('nav.tools.regexMatcher.flags.options.y.desc') }
  ];

  const presets = {
    email: {
      pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      description: t('nav.tools.regexMatcher.presets.patterns.email')
    },
    phone: {
      pattern: '(?:(?:\\+|00)86)?1[3-9]\\d{9}',
      description: t('nav.tools.regexMatcher.presets.patterns.phone')
    },
    url: {
      pattern: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)',
      description: t('nav.tools.regexMatcher.presets.patterns.url')
    },
    date: {
      pattern: '\\d{4}[-/年](0?[1-9]|1[012])[-/月](0?[1-9]|[12][0-9]|3[01])日?',
      description: t('nav.tools.regexMatcher.presets.patterns.date')
    },
    ipv4: {
      pattern: '(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
      description: t('nav.tools.regexMatcher.presets.patterns.ipv4')
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
            <label>{t('nav.tools.regexMatcher.pattern.label')}</label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder={t('nav.tools.regexMatcher.pattern.placeholder')}
            />
          </div>

          <div className="flags-section">
            <label>{t('nav.tools.regexMatcher.flags.title')}</label>
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
                  <span className="flag-label">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="text-input">
            <label>{t('nav.tools.regexMatcher.text.label')}</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('nav.tools.regexMatcher.text.placeholder')}
            />
          </div>
        </div>

        <div className="right-panel">
          <div className="presets-section">
            <label>{t('nav.tools.regexMatcher.presets.label')}</label>
            <select 
              value={selectedPreset} 
              onChange={(e) => setSelectedPreset(e.target.value)}
            >
              <option value="">{t('nav.tools.regexMatcher.presets.select')}</option>
              {Object.entries(presets).map(([key, { description }]) => (
                <option key={key} value={key}>
                  {description}
                </option>
              ))}
            </select>
          </div>

          <button onClick={handleMatch} className="match-button">
            {t('nav.tools.regexMatcher.buttons.match')}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="results-panel">
        <div className="highlighted-content">
          <label>{t('nav.tools.regexMatcher.results.title')} ({t('nav.tools.regexMatcher.results.count', { count: matches.length })}):</label>
          {highlightText()}
        </div>

        {matches.length > 0 && (
          <div className="matches-list">
            <label>{t('nav.tools.regexMatcher.results.details')}</label>
            <div className="matches-container">
              {matches.map((match, index) => (
                <div key={index} className="match-item">
                  <div>{t('nav.tools.regexMatcher.results.match', { number: index + 1 })}</div>
                  <div>{t('nav.tools.regexMatcher.results.value')}: {match.value}</div>
                  <div>{t('nav.tools.regexMatcher.results.position')}: {match.index}</div>
                  {match.groups.length > 0 && (
                    <div>
                      {t('nav.tools.regexMatcher.results.groups')}: 
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