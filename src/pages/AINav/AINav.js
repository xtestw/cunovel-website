import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import aiTools from '../../data/aiTools.json';
import './AINav.css';
import { Helmet } from 'react-helmet';

const AINav = () => {
  const [activeCategory, setActiveCategory] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // 监听右侧内容区域的滚动
  useEffect(() => {
    const handleScroll = () => {
      const contentArea = document.querySelector('.content-area');
      if (!contentArea) return;

      const scrollPosition = contentArea.scrollTop + 100;
      
      for (const { category } of aiTools) {
        const element = document.getElementById(category);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveCategory(category);
            // 更新 URL hash，但不触发新的滚动
            window.history.replaceState(null, '', `#${encodeURIComponent(category)}`);
            break;
          }
        }
      }
    };

    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
      contentArea.addEventListener('scroll', handleScroll);
      return () => contentArea.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // 从 URL 中获取初始类别
  useEffect(() => {
    const hash = location.hash.slice(1);
    if (hash) {
      setActiveCategory(decodeURIComponent(hash));
      // 平滑滚动到目标位置
      const element = document.getElementById(decodeURIComponent(hash));
      if (element) {
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
          contentArea.scrollTo({
            top: element.offsetTop,
            behavior: 'smooth'
          });
        }
      }
    } else if (aiTools.length > 0) {
      setActiveCategory(aiTools[0].category);
    }
  }, [location]);

  // 处理类别点击
  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    // 更新 URL hash
    navigate(`#${encodeURIComponent(category)}`);
    const element = document.getElementById(category);
    if (element) {
      const contentArea = document.querySelector('.content-area');
      if (contentArea) {
        contentArea.scrollTo({
          top: element.offsetTop,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>AI工具导航 | DevTools</title>
        <meta name="description" content="精选AI工具导航,收录各类实用的人工智能工具和资源" />
        <meta name="keywords" content="AI工具,人工智能,ChatGPT,AI导航,开发工具" />
      </Helmet>
      <div className="ai-nav-container">
        {/* Chrome 插件提示 */}
        <div className="category-sidebar">
          <div className="category-list">
            {aiTools.map(({ category }) => (
              <div
                key={category}
                className={`category-item ${activeCategory === category ? 'active' : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </div>
            ))}
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="content-area">
          {aiTools.map(({ category, items }) => (
            <div
              key={category}
              id={category}
              className="category-section"
            >
              <h2 className="category-title">{category}</h2>
              <div className="tools-grid">
                {items.map((tool) => (
                  <a
                    key={tool.link}
                    href={tool.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tool-card"
                  >
                    <div className="tool-icon">
                      <img src={tool.icon} alt={tool.name} loading="lazy" />
                    </div>
                    <div className="tool-info">
                      <h3>{tool.name}</h3>
                      <p>{tool.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AINav; 