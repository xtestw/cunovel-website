import React, { useState, useEffect } from 'react';
import './TextCounter.css';

const TextCounter = () => {
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
          placeholder="在此输入或粘贴文本..."
          className="text-input"
        />
      </div>
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <label>总字符数:</label>
            <span>{stats.characters}</span>
          </div>
          <div className="stat-item">
            <label>不含空格字符数:</label>
            <span>{stats.charactersNoSpace}</span>
          </div>
          <div className="stat-item">
            <label>单词数:</label>
            <span>{stats.words}</span>
          </div>
          <div className="stat-item">
            <label>行数:</label>
            <span>{stats.lines}</span>
          </div>
          <div className="stat-item">
            <label>段落数:</label>
            <span>{stats.paragraphs}</span>
          </div>
          <div className="stat-item">
            <label>中文字数:</label>
            <span>{stats.chinese}</span>
          </div>
          <div className="stat-item">
            <label>英文字母数:</label>
            <span>{stats.english}</span>
          </div>
          <div className="stat-item">
            <label>数字个数:</label>
            <span>{stats.numbers}</span>
          </div>
          <div className="stat-item">
            <label>空格数:</label>
            <span>{stats.spaces}</span>
          </div>
          <div className="stat-item">
            <label>标点符号数:</label>
            <span>{stats.punctuation}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextCounter; 