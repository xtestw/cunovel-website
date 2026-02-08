import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './Home.css';

const WEEKDAY_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const isHTML = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /<\/?[a-z][\s\S]*>/i.test(str);
};

const WEATHER_CODE_MAP = {
  0: { zh: '晴', en: 'Clear' },
  1: { zh: '大部晴朗', en: 'Mainly clear' },
  2: { zh: '少云', en: 'Partly cloudy' },
  3: { zh: '多云', en: 'Overcast' },
  45: { zh: '雾', en: 'Foggy' },
  48: { zh: '雾', en: 'Foggy' },
  51: { zh: '毛毛雨', en: 'Drizzle' },
  53: { zh: '毛毛雨', en: 'Drizzle' },
  55: { zh: '毛毛雨', en: 'Drizzle' },
  61: { zh: '小雨', en: 'Light rain' },
  63: { zh: '中雨', en: 'Rain' },
  65: { zh: '大雨', en: 'Heavy rain' },
  71: { zh: '小雪', en: 'Light snow' },
  73: { zh: '中雪', en: 'Snow' },
  75: { zh: '大雪', en: 'Heavy snow' },
  80: { zh: '小阵雨', en: 'Rain showers' },
  81: { zh: '阵雨', en: 'Rain showers' },
  82: { zh: '大阵雨', en: 'Rain showers' },
  95: { zh: '雷雨', en: 'Thunderstorm' },
};

function getWeatherLabel(code, isZh) {
  const item = WEATHER_CODE_MAP[code] || { zh: '未知', en: 'Unknown' };
  return isZh ? item.zh : item.en;
}

function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isZh = i18n.language.startsWith('zh');

  const [weather, setWeather] = useState({ loading: true, temp: null, code: null, error: null });
  const [todayDaily, setTodayDaily] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(true);

  const now = new Date();
  const weekdayLabels = isZh ? WEEKDAY_ZH : WEEKDAY_EN;
  const dateStr = now.toLocaleDateString(isZh ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const weekday = weekdayLabels[now.getDay()];
  const timeStr = now.toLocaleTimeString(isZh ? 'zh-CN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !isZh,
  });

  useEffect(() => {
    let cancelled = false;
    const defaultLat = 39.9;
    const defaultLon = 116.4;

    const fetchWeather = (lat, lon) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          if (data.current_weather) {
            setWeather({
              loading: false,
              temp: Math.round(data.current_weather.temperature),
              code: data.current_weather.weathercode,
              error: null,
            });
          } else {
            setWeather({ loading: false, temp: null, code: null, error: true });
          }
        })
        .catch(() => {
          if (!cancelled) setWeather({ loading: false, temp: null, code: null, error: true });
        });
    };

    if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(defaultLat, defaultLon),
        { timeout: 5000 }
      );
    } else {
      fetchWeather(defaultLat, defaultLon);
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const lang = isZh ? 'zh' : 'en';
    fetch(`${API_BASE_URL}/ai-daily/today?lang=${lang}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setTodayDaily(data || null);
        }
      })
      .catch(() => {
        if (!cancelled) setTodayDaily(null);
      })
      .finally(() => {
        if (!cancelled) setDailyLoading(false);
      });
    return () => { cancelled = true; };
  }, [isZh]);

  const weatherLabel = weather.code != null ? getWeatherLabel(weather.code, isZh) : '';

  const verifyLinks = [
    { to: '/phone-verify', key: 'phoneVerify' },
    { to: '/vehicle-verify', key: 'vehicleInfoVerify' },
    { to: '/bank-card-verify', key: 'bankCardVerify' },
    { to: '/vehicle-verify/orders', key: 'orderHistory' },
  ];

  const toolboxCategories = [
    { key: 'json', tool: 'formatter' },
    { key: 'time', tool: 'timestamp' },
    { key: 'text', tool: 'compare' },
    { key: 'encode', tool: 'base64' },
    { key: 'image', tool: 'imageNav' },
    { key: 'code', tool: 'formatter' },
  ];

  const tutorialLinks = [
    { to: '/prompt-tutorial/intro', key: 'promptTutorial' },
    { to: '/agent-skill', key: 'agentSkill' },
  ];

  const aiToolLinks = [
    { to: '/token-calculator/text', key: 'tokenCalculator' },
    { to: '/ai-nav', key: 'aiNav' },
  ];

  const introSlidesRaw = t('home.introSlides', { returnObjects: true });
  const introSlides = Array.isArray(introSlidesRaw) ? introSlidesRaw : Object.values(introSlidesRaw || {});
  const [introIndex, setIntroIndex] = useState(0);
  const currentIntro = introSlides[introIndex] || introSlides[0];

  useEffect(() => {
    if (introSlides.length <= 1) return;
    const id = setInterval(() => {
      setIntroIndex((i) => (i >= introSlides.length - 1 ? 0 : i + 1));
    }, 5000);
    return () => clearInterval(id);
  }, [introSlides.length]);

  const pluginLinks = [
    { to: '/chrome-plugin', key: 'chromePlugin', external: false },
    { to: 'https://plugins.jetbrains.com/plugin/26245-cutool?noRedirect=true', key: 'ideaPlugin', external: true },
  ];

  return (
    <div className="home-page">
      <Helmet>
        <title>{t('home.pageTitle')} - CUTool</title>
        <meta name="description" content={t('home.metaDescription')} />
      </Helmet>

      {/* 最顶部：左上角日期 + 右上角天气 */}
      <div className="home-top-bar">
        <div className="home-date-card">
          <div className="home-date-main">{weekday} · {dateStr}</div>
          <div className="home-date-time">{timeStr}</div>
        </div>
        <div className="home-weather-card">
          <span className="home-weather-label">{t('home.weather')}</span>
          {weather.loading && <span className="home-weather-value">{t('home.weatherLoading')}</span>}
          {!weather.loading && weather.error && <span className="home-weather-value">{t('home.weatherError')}</span>}
          {!weather.loading && !weather.error && weather.temp != null && (
            <span className="home-weather-value">
              {weatherLabel} {weather.temp}°C
            </span>
          )}
        </div>
      </div>

      {/* 网站介绍：左右箭头 + 内容区（可换成图片），自动轮播，无 tab */}
      <section className="home-intro">
        <h1 className="home-intro-title">{t('home.heroTitle')}</h1>
        {introSlides.length > 0 ? (
          <div className="home-intro-wrap">
            <button
              type="button"
              className="home-intro-arrow"
              aria-label="上一段"
              onClick={() => setIntroIndex((i) => (i <= 0 ? introSlides.length - 1 : i - 1))}
            >
              ‹
            </button>
            <div className="home-intro-center">
              <div className="home-intro-content">
                <p className="home-intro-tagline">{currentIntro?.tagline}</p>
                <p className="home-intro-desc">{currentIntro?.desc}</p>
              </div>
            </div>
            <button
              type="button"
              className="home-intro-arrow"
              aria-label="下一段"
              onClick={() => setIntroIndex((i) => (i >= introSlides.length - 1 ? 0 : i + 1))}
            >
              ›
            </button>
          </div>
        ) : (
          <>
            <p className="home-intro-tagline">{t('home.introTagline')}</p>
            <p className="home-intro-desc">{t('home.introDesc')}</p>
          </>
        )}
      </section>

      {/* 当日 AI 新闻 */}
      <section className="home-ai-news">
        <h2 className="home-section-title">
          {t('home.sectionAiNews')}
          <Link to="/ai-daily" className="home-section-more">
            {t('home.viewAllDaily')}
          </Link>
        </h2>
        {dailyLoading && <div className="home-news-loading">{t('home.newsLoading')}</div>}
        {!dailyLoading && !todayDaily && <div className="home-news-empty">{t('home.newsEmpty')}</div>}
        {!dailyLoading && todayDaily && (
          <div className="home-news-block">
            {todayDaily.summary && (
              <div className="home-news-summary">
                {isHTML(todayDaily.summary) ? (
                  <div dangerouslySetInnerHTML={{ __html: todayDaily.summary }} />
                ) : (
                  <p>{todayDaily.summary}</p>
                )}
              </div>
            )}
            {todayDaily.news && todayDaily.news.length > 0 && (
              <ul className="home-news-list">
                {todayDaily.news.slice(0, 5).map((item, index) => (
                  <li key={index} className="home-news-item">
                    <button
                      type="button"
                      className="home-news-link"
                      onClick={() => navigate(`/ai-daily/${todayDaily.date}/news/${index}`)}
                    >
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* 信息核验（仅中文） */}
      {isZh && (
        <section className="home-nav-section">
          <h2 className="home-section-title">{t('home.sectionVerify')}</h2>
          <div className="home-nav-grid">
            {verifyLinks.map((item) => (
              <Link key={item.key} to={item.to} className="home-nav-card">
                <h3 className="home-nav-card-title">{t(`common.${item.key}`)}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 工具箱 */}
      <section className="home-nav-section">
        <h2 className="home-section-title">{t('home.sectionToolbox')}</h2>
        <div className="home-nav-grid">
          {toolboxCategories.map((cat) => (
            <Link
              key={cat.key}
              to={`/tools/${cat.key}/${cat.tool}`}
              className="home-nav-card"
            >
              <h3 className="home-nav-card-title">{t(`nav.categories.${cat.key}`)}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* 教程 */}
      <section className="home-nav-section">
        <h2 className="home-section-title">{t('home.sectionTutorial')}</h2>
        <div className="home-nav-grid">
          {tutorialLinks.map((item) => (
            <Link key={item.key} to={item.to} className="home-nav-card">
              <h3 className="home-nav-card-title">{t(`common.${item.key}`)}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* AI 工具 */}
      <section className="home-nav-section">
        <h2 className="home-section-title">{t('home.sectionAiTools')}</h2>
        <div className="home-nav-grid">
          {aiToolLinks.map((item) => (
            <Link key={item.key} to={item.to} className="home-nav-card">
              <h3 className="home-nav-card-title">{t(`common.${item.key}`)}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* 插件 */}
      <section className="home-nav-section">
        <h2 className="home-section-title">{t('home.sectionPlugins')}</h2>
        <div className="home-nav-grid">
          {pluginLinks.map((item) =>
            item.external ? (
              <a
                key={item.key}
                href={item.to}
                target="_blank"
                rel="noopener noreferrer"
                className="home-nav-card"
              >
                <h3 className="home-nav-card-title">
                  {t(`common.${item.key}`)}
                  <span className="home-nav-card-external">↗</span>
                </h3>
              </a>
            ) : (
              <Link key={item.key} to={item.to} className="home-nav-card">
                <h3 className="home-nav-card-title">{t(`common.${item.key}`)}</h3>
              </Link>
            )
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
