import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config/api';
import './AIDaily.css';

const AIDailyHistory = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [historyDailies, setHistoryDailies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取当前语言代码（zh 或 en）
  const getLanguageCode = () => {
    return i18n.language.startsWith('zh') ? 'zh' : 'en';
  };

  useEffect(() => {
    fetchHistoryDailies();
  }, [i18n.language]);

  const fetchHistoryDailies = async () => {
    try {
      setLoading(true);
      const lang = getLanguageCode();
      const response = await fetch(`${API_BASE_URL}/ai-daily/history?lang=${lang}`);
      if (!response.ok) {
        throw new Error('Failed to fetch history dailies');
      }
      const data = await response.json();
      setHistoryDailies(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching history dailies:', err);
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

  return (
    <>
      <Helmet>
        <title>{t('aiDaily.seo.history.title')}</title>
        <meta name="description" content={t('aiDaily.seo.history.description')} />
        <meta name="keywords" content={t('aiDaily.seo.history.keywords')} />
        <meta property="og:title" content={t('aiDaily.seo.history.title')} />
        <meta property="og:description" content={t('aiDaily.seo.history.description')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/ai-daily/history`} />
        <link rel="canonical" href={`${window.location.origin}/ai-daily/history`} />
      </Helmet>
      <div className="ai-daily-container">
        <div className="ai-daily-content">
          <div className="history-daily-section">
            <h1 className="section-title">{t('aiDaily.history.title')}</h1>
            {historyDailies && historyDailies.length > 0 ? (
              <div className="history-list">
                {historyDailies.map((daily, index) => (
                  <div key={index} className="history-item">
                    <div className="history-date">{daily.date}</div>
                    {daily.summary && (
                      <p className="history-summary">{daily.summary}</p>
                    )}
                    {daily.news && daily.news.length > 0 && (
                      <div className="history-news-count">
                        {t('aiDaily.history.newsCount', { count: daily.news.length })}
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/ai-daily/${daily.date}`)}
                      className="history-link"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', color: '#1890ff' }}
                    >
                      {t('aiDaily.history.viewDetails')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>{t('aiDaily.history.empty')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AIDailyHistory;

