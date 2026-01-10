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
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  // 从 HTML 中提取纯文本（不使用 DOM，避免 SSR 问题）
  const extractTextFromHTML = (html) => {
    if (!html) return '';
    // 使用正则表达式移除 HTML 标签
    return html
      .replace(/<[^>]*>/g, '') // 移除所有 HTML 标签
      .replace(/&nbsp;/g, ' ') // 替换 &nbsp;
      .replace(/&amp;/g, '&') // 替换 &amp;
      .replace(/&lt;/g, '<') // 替换 &lt;
      .replace(/&gt;/g, '>') // 替换 &gt;
      .replace(/&quot;/g, '"') // 替换 &quot;
      .replace(/&#39;/g, "'") // 替换 &#39;
      .trim();
  };

  // 渲染 summary 内容（兼容 HTML 和纯文本，用于历史列表预览）
  const renderSummaryPreview = (summary) => {
    if (!summary) return null;
    // 对于历史列表，只显示纯文本预览，移除 HTML 标签
    let textContent = '';
    if (isHTML(summary)) {
      textContent = extractTextFromHTML(summary);
    } else {
      textContent = summary;
    }
    // 限制长度用于预览
    const preview = textContent.length > 150 ? textContent.substring(0, 150) + '...' : textContent;
    return <p className="history-summary">{preview}</p>;
  };

  useEffect(() => {
    fetchHistoryDailies(1);
  }, [i18n.language]);

  const fetchHistoryDailies = async (page = 1) => {
    try {
      setLoading(true);
      const lang = getLanguageCode();
      const pageSize = pagination.pageSize || 20;
      let url = `${API_BASE_URL}/ai-daily/history?lang=${lang}&page=${page}&pageSize=${pageSize}`;
      
      if (startDate) {
        url += `&startDate=${startDate}`;
      }
      if (endDate) {
        url += `&endDate=${endDate}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch history dailies');
      }
      const data = await response.json();
      
      // 兼容旧格式（如果没有pagination字段）
      if (data.pagination) {
        setHistoryDailies(data.data || []);
        setPagination(data.pagination);
      } else {
        // 旧格式，直接是数组
        setHistoryDailies(Array.isArray(data) ? data : []);
        setPagination({
          page: 1,
          pageSize: 20,
          total: Array.isArray(data) ? data.length : 0,
          totalPages: 1
        });
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching history dailies:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchHistoryDailies(1);
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    fetchHistoryDailies(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchHistoryDailies(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
            
            {/* 日期范围筛选 */}
            <div className="history-filter">
              <div className="filter-row">
                <div className="filter-item">
                  <label>{t('aiDaily.history.startDate')}:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="date-input"
                  />
                </div>
                <div className="filter-item">
                  <label>{t('aiDaily.history.endDate')}:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="date-input"
                  />
                </div>
                <div className="filter-actions">
                  <button onClick={handleSearch} className="search-button">
                    {t('aiDaily.history.search')}
                  </button>
                  <button onClick={handleReset} className="reset-button">
                    {t('aiDaily.history.reset')}
                  </button>
                </div>
              </div>
            </div>

            {/* 日报列表 */}
            {historyDailies && historyDailies.length > 0 ? (
              <>
                <div className="history-list">
                  {historyDailies.map((daily, index) => (
                    <div key={index} className="history-item">
                      <div className="history-date">{daily.date}</div>
                      {renderSummaryPreview(daily.summary)}
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
                
                {/* 分页组件 */}
                {pagination.totalPages > 0 && (
                  <div className="pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="pagination-button"
                    >
                      {t('aiDaily.history.prevPage')}
                    </button>
                    <span className="pagination-info">
                      {t('aiDaily.history.pageInfo', {
                        current: pagination.page,
                        total: pagination.totalPages,
                        count: pagination.total
                      })}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="pagination-button"
                    >
                      {t('aiDaily.history.nextPage')}
                    </button>
                  </div>
                )}
              </>
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

