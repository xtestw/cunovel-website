import React, { useState, useEffect } from 'react';
import './TextCounter.css';
import { useTranslation } from 'react-i18next';

const TextCounter = () => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [stats, setStats] = useState({
    characters: 0,
    charactersNoSpace: 0,
    words: 0,
    lines: 0,
    paragraphs: 0,
    chinese: 0,
    english: 0,
    numbers: 0,
    spaces: 0,
    punctuation: 0
  });

  useEffect(() => {
    calculateStats(text);
  }, [text]);

  const calculateStats = (text) => {
    const stats = {
      characters: text.length,
      charactersNoSpace: text.replace(/\s/g, '').length,
      words: text.trim().split(/\s+/).filter(word => word.length > 0).length,
      lines: text.split('\n').length,
      paragraphs: text.split('\n\n').filter(para => para.trim().length > 0).length,
      chinese: (text.match(/[\u4e00-\u9fa5]/g) || []).length,
      english: (text.match(/[a-zA-Z]/g) || []).length,
      numbers: (text.match(/[0-9]/g) || []).length,
      spaces: (text.match(/\s/g) || []).length,
      punctuation: (text.match(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~。，、；：？！…—·ˉ¨''""々～‖∶＂＇｀｜〃〔〕〈〉《》「」『』．〖〗【】（）［］｛｝]/g) || []).length
    };
    setStats(stats);
  };

  return (
    <div className="text-counter-container">
      <div className="input-section">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('nav.tools.textCounter.placeholder')}
          className="text-input"
        />
      </div>
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.characters')}:</label>
            <span>{stats.characters}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.charactersNoSpace')}:</label>
            <span>{stats.charactersNoSpace}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.words')}:</label>
            <span>{stats.words}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.lines')}:</label>
            <span>{stats.lines}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.paragraphs')}:</label>
            <span>{stats.paragraphs}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.chinese')}:</label>
            <span>{stats.chinese}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.english')}:</label>
            <span>{stats.english}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.numbers')}:</label>
            <span>{stats.numbers}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.spaces')}:</label>
            <span>{stats.spaces}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.punctuation')}:</label>
            <span>{stats.punctuation}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextCounter; 