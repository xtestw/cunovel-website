import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import './TextCounter.css';

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
    const calculateStats = () => {
      const lines = text.split('\n');
      const paragraphs = lines.filter(line => line.trim().length > 0);
      const spaces = (text.match(/\s/g) || []).length;
      const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
      const english = (text.match(/[a-zA-Z]/g) || []).length;
      const numbers = (text.match(/[0-9]/g) || []).length;
      const punctuation = (text.match(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~。，、；：？！…—·ˉ¨''""々～‖∶＂＇｀｜〃〔〕〈〉《》「」『』．〖〗【】（）［］｛｝]/g) || []).length;

      setStats({
        characters: text.length,
        charactersNoSpace: text.replace(/\s/g, '').length,
        words: text.trim().split(/\s+/).filter(word => word.length > 0).length,
        lines: lines.length,
        paragraphs: paragraphs.length,
        chinese,
        english,
        numbers,
        spaces,
        punctuation
      });
    };

    calculateStats();
  }, [text]);

  return (
    <>
      <Helmet>
        <title>字数统计工具 | Text Counter - CUTool</title>
        <meta name="description" content="在线字数统计工具，支持中英文字符统计，字数、词数、行数、段落数等多维度统计。Online text statistics tool supporting Chinese and English character counting, words, lines, paragraphs and more." />
        <meta name="keywords" content="text counter, word count, character count, text statistics, 字数统计, 文本统计, 字符统计, 词数统计" />
      </Helmet>
      <div className="text-counter-container">
        <div className="input-area">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('nav.tools.textCounter.placeholder')}
            spellCheck="false"
          />
        </div>
        
        <div className="stats-grid">
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.characters')}</label>
            <span>{stats.characters}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.charactersNoSpace')}</label>
            <span>{stats.charactersNoSpace}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.words')}</label>
            <span>{stats.words}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.lines')}</label>
            <span>{stats.lines}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.paragraphs')}</label>
            <span>{stats.paragraphs}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.chinese')}</label>
            <span>{stats.chinese}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.english')}</label>
            <span>{stats.english}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.numbers')}</label>
            <span>{stats.numbers}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.spaces')}</label>
            <span>{stats.spaces}</span>
          </div>
          <div className="stat-item">
            <label>{t('nav.tools.textCounter.results.punctuation')}</label>
            <span>{stats.punctuation}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default TextCounter; 