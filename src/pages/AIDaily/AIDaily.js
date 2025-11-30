import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './AIDaily.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3003/api';

const AIDaily = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [todayDaily, setTodayDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取当前语言代码（zh 或 en）
  const getLanguageCode = () => {
    return i18n.language.startsWith('zh') ? 'zh' : 'en';
  };

  useEffect(() => {
    fetchTodayDaily();
  }, [i18n.language]);

  const fetchTodayDaily = async () => {
    try {
      setLoading(true);
      const lang = getLanguageCode();
      const response = await fetch(`${API_BASE_URL}/ai-daily/today?lang=${lang}`);
      if (!response.ok) {
        throw new Error('Failed to fetch today daily');
      }
      const data = await response.json();
      setTodayDaily(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching today daily:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ai-daily-container">
        <div className="loading">{t('aiDaily.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-daily-container">
        <div className="error">{t('aiDaily.error')}: {error}</div>
      </div>
    );
  }

  // 生成结构化数据（JSON-LD）
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": t('aiDaily.seo.today.title'),
    "description": t('aiDaily.seo.today.description'),
    "url": `${window.location.origin}/ai-daily`,
    "publisher": {
      "@type": "Organization",
      "name": "CUTool",
      "url": "https://cutool.online"
    },
    "datePublished": todayDaily?.date || new Date().toISOString().split('T')[0],
    "dateModified": todayDaily?.date || new Date().toISOString().split('T')[0],
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": todayDaily?.news?.length || 0,
      "itemListElement": todayDaily?.news?.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "NewsArticle",
          "headline": item.title,
          "description": item.summary,
          "url": item.link || `${window.location.origin}/ai-daily/${todayDaily?.date}/news/${index}`
        }
      })) || []
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('aiDaily.seo.today.title')}</title>
        <meta name="description" content={t('aiDaily.seo.today.description')} />
        <meta name="keywords" content={t('aiDaily.seo.today.keywords')} />
        <meta property="og:title" content={t('aiDaily.seo.today.title')} />
        <meta property="og:description" content={t('aiDaily.seo.today.description')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/ai-daily`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('aiDaily.seo.today.title')} />
        <meta name="twitter:description" content={t('aiDaily.seo.today.description')} />
        <link rel="canonical" href={`${window.location.origin}/ai-daily`} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      <div className="ai-daily-container">
        <div className="ai-daily-content">
          {/* 今天的日报 */}
          {todayDaily && (
                <div className="today-daily-section">
                  <h1 className="section-title">{t('aiDaily.today.title')}</h1>
                  <div className="daily-date">{todayDaily.date}</div>
                  
                  {/* 日报概要 */}
                  {todayDaily.summary && (
                    <div className="daily-summary">
                      <h2 className="summary-title">{t('aiDaily.today.summary')}</h2>
                      <p className="summary-content">{todayDaily.summary}</p>
                    </div>
                  )}

              {/* 新闻列表 */}
              {todayDaily.news && todayDaily.news.length > 0 && (
                <div className="news-list">
                  <h2 className="news-title">{t('aiDaily.today.news')}</h2>
                  {todayDaily.news.map((item, index) => (
                    <div key={index} className="news-item">
                      <h3 className="news-item-title">
                        <button
                          onClick={() => navigate(`/ai-daily/${todayDaily.date}/news/${index}`)}
                          className="news-link-button-title"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', color: '#1890ff', textAlign: 'left' }}
                        >
                          {item.title}
                        </button>
                      </h3>
                      {item.summary && (
                        <p className="news-summary">{item.summary}</p>
                      )}
                      <div className="news-actions">
                        <button
                          onClick={() => navigate(`/ai-daily/${todayDaily.date}/news/${index}`)}
                          className="news-link-button"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', color: '#1890ff' }}
                        >
                          {t('aiDaily.today.viewDetails')}
                        </button>
                        {item.link && (
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="news-link-button"
                            style={{ marginLeft: '16px' }}
                          >
                            {t('aiDaily.today.viewOriginal')}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!todayDaily && (
            <div className="empty-state">
              <p>{t('aiDaily.today.empty')}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AIDaily;

