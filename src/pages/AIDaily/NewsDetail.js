import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config/api';
import './AIDaily.css';

const NewsDetail = () => {
  const { date, newsId } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取当前语言代码（zh 或 en）
  const getLanguageCode = () => {
    return i18n.language.startsWith('zh') ? 'zh' : 'en';
  };

  // 检测内容是否是 HTML 格式
  const isHTML = (str) => {
    if (!str || typeof str !== 'string') return false;
    // 检查是否包含 HTML 标签
    const htmlTagPattern = /<\/?[a-z][\s\S]*>/i;
    return htmlTagPattern.test(str);
  };

  // 格式化纯文本内容（保留换行）
  const formatPlainText = (text) => {
    if (!text) return '';
    // 将换行符转换为 <br>，多个连续换行转换为段落
    return text
      .split(/\n\s*\n/)  // 按双换行分割段落
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  };

  // 渲染内容（兼容 HTML 和纯文本）
  const renderContent = (content) => {
    if (!content) return null;
    if (isHTML(content)) {
      return <div className="news-detail-content" dangerouslySetInnerHTML={{ __html: content }} />;
    } else {
      // 纯文本需要格式化
      const formattedHTML = formatPlainText(content);
      return <div className="news-detail-content" dangerouslySetInnerHTML={{ __html: formattedHTML }} />;
    }
  };

  // 渲染摘要（兼容 HTML 和纯文本）
  const renderSummary = (summary) => {
    if (!summary) return null;
    if (isHTML(summary)) {
      return <div dangerouslySetInnerHTML={{ __html: summary }} />;
    } else {
      // 纯文本需要格式化
      const formattedHTML = formatPlainText(summary);
      return <div dangerouslySetInnerHTML={{ __html: formattedHTML }} />;
    }
  };

  useEffect(() => {
    fetchNewsDetail();
  }, [date, newsId, i18n.language]);

  const fetchNewsDetail = async () => {
    try {
      const lang = getLanguageCode();
      const response = await fetch(`${API_BASE_URL}/ai-daily/${date}/news/${newsId}?lang=${lang}`);
      if (!response.ok) {
        throw new Error('Failed to fetch news detail');
      }
      const data = await response.json();
      setNews(data);
    } catch (err) {
      console.error('Error fetching news detail:', err);
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

  if (error || !news) {
    return (
      <div className="ai-daily-container">
        <div className="error">加载失败: {error || '未找到该新闻'}</div>
        <button onClick={() => navigate('/ai-daily')} className="back-button">
          返回日报列表
        </button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{news.title} | AI日报 | CUTool</title>
        <meta name="description" content={news.summary || news.title || 'AI行业新闻详情'} />
        <meta name="keywords" content={`${news.title},AI新闻,人工智能,${news.tags ? news.tags.join(',') : ''}`} />
        <meta property="og:title" content={`${news.title} | AI日报`} />
        <meta property="og:description" content={news.summary || news.title || 'AI行业新闻详情'} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${window.location.origin}/ai-daily/${date}/news/${newsId}`} />
        {news.link && <meta property="og:url" content={news.link} />}
        <meta name="article:published_time" content={news.date || date} />
        {news.tags && news.tags.length > 0 && (
          <meta name="article:tag" content={news.tags.join(',')} />
        )}
        <link rel="canonical" href={`${window.location.origin}/ai-daily/${date}/news/${newsId}`} />
      </Helmet>
      <div className="ai-daily-container">
        <div className="ai-daily-content">
          <button onClick={() => navigate(date ? `/ai-daily/${date}` : '/ai-daily')} className="back-button">
            ← 返回
          </button>
          
          <div className="news-detail-section">
            <div className="news-detail-date">{news.date || date}</div>
            <h1 className="news-detail-title">{news.title}</h1>
            
            {news.summary && (
              <div className="news-detail-summary">
                {renderSummary(news.summary)}
              </div>
            )}

            {news.content && renderContent(news.content)}

            {news.source && (
              <div className="news-detail-source">
                <strong>来源：</strong>
                {news.sourceLink ? (
                  <a 
                    href={news.sourceLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="source-link"
                  >
                    {news.source}
                  </a>
                ) : (
                  <span>{news.source}</span>
                )}
              </div>
            )}

            {news.link && (
              <div className="news-detail-external-link">
                <a 
                  href={news.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="external-link-button"
                >
                  查看原文 →
                </a>
              </div>
            )}

            {news.tags && news.tags.length > 0 && (
              <div className="news-detail-tags">
                {news.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NewsDetail;

