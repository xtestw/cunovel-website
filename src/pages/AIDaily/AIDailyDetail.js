import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config/api';
import './AIDaily.css';

const AIDailyDetail = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取当前语言代码（zh 或 en）
  const getLanguageCode = () => {
    return i18n.language.startsWith('zh') ? 'zh' : 'en';
  };

  useEffect(() => {
    fetchDailyDetail();
  }, [date, i18n.language]);

  const fetchDailyDetail = async () => {
    try {
      const lang = getLanguageCode();
      const response = await fetch(`${API_BASE_URL}/ai-daily/${date}?lang=${lang}`);
      if (!response.ok) {
        throw new Error('Failed to fetch daily detail');
      }
      const data = await response.json();
      setDaily(data);
    } catch (err) {
      console.error('Error fetching daily detail:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ai-daily-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (error || !daily) {
    return (
      <div className="ai-daily-container">
        <div className="error">加载失败: {error || '未找到该日期的日报'}</div>
        <button onClick={() => navigate('/ai-daily')} className="back-button">
          返回日报列表
        </button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>AI日报 - {daily.date} | CUTool</title>
        <meta name="description" content={`${daily.date}的AI行业新闻和动态：${daily.summary || '查看当日AI行业最新资讯'}`} />
        <meta name="keywords" content={`AI日报,${daily.date},AI新闻,人工智能新闻,AI动态`} />
        <meta property="og:title" content={`AI日报 - ${daily.date} | CUTool`} />
        <meta property="og:description" content={`${daily.date}的AI行业新闻和动态`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${window.location.origin}/ai-daily/${daily.date}`} />
        <link rel="canonical" href={`${window.location.origin}/ai-daily/${daily.date}`} />
      </Helmet>
      <div className="ai-daily-container">
        <div className="ai-daily-content">
          <button onClick={() => navigate('/ai-daily')} className="back-button">
            ← 返回日报列表
          </button>
          
          <div className="today-daily-section">
            <h1 className="section-title">AI日报 - {daily.date}</h1>
            
            {daily.summary && (
              <div className="daily-summary">
                <h2 className="summary-title">日报概要</h2>
                <p className="summary-content">{daily.summary}</p>
              </div>
            )}

            {daily.news && daily.news.length > 0 && (
              <div className="news-list">
                <h2 className="news-title">新闻列表</h2>
                {daily.news.map((item, index) => (
                  <div key={index} className="news-item">
                    <h3 className="news-item-title">
                      <button
                        onClick={() => navigate(`/ai-daily/${daily.date}/news/${index}`)}
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
                        onClick={() => navigate(`/ai-daily/${daily.date}/news/${index}`)}
                        className="news-link-button"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', color: '#1890ff' }}
                      >
                        查看详情 →
                      </button>
                      {item.link && (
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="news-link-button"
                          style={{ marginLeft: '16px' }}
                        >
                          查看原文 →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AIDailyDetail;

