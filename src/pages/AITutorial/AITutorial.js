import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config/api';
import './AITutorial.css';

const AITutorial = () => {
  const { i18n } = useTranslation();
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchTutorials();
  }, [i18n.language]);

  // 获取当前语言代码（zh 或 en）
  const getLanguageCode = () => {
    return i18n.language.startsWith('zh') ? 'zh' : 'en';
  };

  const fetchTutorials = async () => {
    try {
      const lang = getLanguageCode();
      const response = await fetch(`${API_BASE_URL}/ai-tutorial?lang=${lang}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tutorials');
      }
      const data = await response.json();
      setTutorials(data);
    } catch (err) {
      console.error('Error fetching tutorials:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(tutorials.map(t => t.category).filter(Boolean))];
  const filteredTutorials = selectedCategory === 'all' 
    ? tutorials 
    : tutorials.filter(t => t.category === selectedCategory);

  if (loading) {
    return (
      <div className="ai-tutorial-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-tutorial-container">
        <div className="error">加载失败: {error}</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>AI教程 | CUTool</title>
        <meta name="description" content="AI相关教程和指南，学习人工智能技术的最佳实践" />
        <meta name="keywords" content="AI教程,人工智能教程,AI学习,AI指南" />
      </Helmet>
      <div className="ai-tutorial-container">
        <div className="ai-tutorial-content">
          <h1 className="page-title">AI教程</h1>
          
          {/* 分类筛选 */}
          {categories.length > 1 && (
            <div className="category-filter">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? '全部' : category}
                </button>
              ))}
            </div>
          )}

          {/* 教程列表 */}
          <div className="tutorial-list">
            {filteredTutorials.length === 0 ? (
              <div className="empty-state">暂无教程内容</div>
            ) : (
              filteredTutorials.map((tutorial, index) => (
                <div key={index} className="tutorial-item">
                  {tutorial.category && (
                    <div className="tutorial-category">{tutorial.category}</div>
                  )}
                  <h2 className="tutorial-title">
                    {tutorial.link ? (
                      <a 
                        href={tutorial.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="tutorial-link"
                      >
                        {tutorial.title}
                      </a>
                    ) : (
                      tutorial.title
                    )}
                  </h2>
                  {tutorial.description && (
                    <p className="tutorial-description">{tutorial.description}</p>
                  )}
                  {tutorial.content && (
                    <div className="tutorial-content">
                      {tutorial.content}
                    </div>
                  )}
                  {tutorial.link && (
                    <a 
                      href={tutorial.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="tutorial-link-button"
                    >
                      查看详情 →
                    </a>
                  )}
                  {tutorial.tags && tutorial.tags.length > 0 && (
                    <div className="tutorial-tags">
                      {tutorial.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AITutorial;

