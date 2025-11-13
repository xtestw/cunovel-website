import React, { useState, useEffect } from 'react';
import './CronExpression.css';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';

const CronExpression = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState('generate'); // 'generate' or 'explain'
  const [cronExpression, setCronExpression] = useState('');
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');

  // 生成模式的状态
  const [minute, setMinute] = useState('*');
  const [hour, setHour] = useState('*');
  const [dayOfMonth, setDayOfMonth] = useState('*');
  const [month, setMonth] = useState('*');
  const [dayOfWeek, setDayOfWeek] = useState('*');

  // 预设选项
  const presets = [
    { label: t('nav.tools.time.cron.presets.everyMinute'), value: '* * * * *' },
    { label: t('nav.tools.time.cron.presets.everyHour'), value: '0 * * * *' },
    { label: t('nav.tools.time.cron.presets.everyDay'), value: '0 0 * * *' },
    { label: t('nav.tools.time.cron.presets.everyWeek'), value: '0 0 * * 0' },
    { label: t('nav.tools.time.cron.presets.everyMonth'), value: '0 0 1 * *' },
    { label: t('nav.tools.time.cron.presets.workdays'), value: '0 9 * * 1-5' },
    { label: t('nav.tools.time.cron.presets.weekends'), value: '0 9 * * 0,6' },
  ];

  // 验证 cron 表达式
  const validateCronExpression = (cron) => {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) {
      return false;
    }
    
    // 简化的验证：检查每个部分是否包含有效的 cron 字符
    // 允许: *, ?, 数字, -, ,, /
    const validChars = /^[\d\*\?\,\-\/]+$/;
    
    return parts.every((part) => {
      if (part === '*' || part === '?') {
        return true;
      }
      // 检查是否包含有效字符
      if (!validChars.test(part)) {
        return false;
      }
      // 基本格式检查
      if (part.includes('/')) {
        const [base, interval] = part.split('/');
        if (base !== '*' && isNaN(parseInt(base))) {
          return false;
        }
        if (isNaN(parseInt(interval))) {
          return false;
        }
      }
      return true;
    });
  };

  // 解释 cron 表达式
  const explainCronExpression = (cron) => {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) {
      return t('nav.tools.time.cron.errors.invalidFormat');
    }

    const [min, hr, dayMonth, mon, dayWeek] = parts;
    const explanations = [];

    // 解释分钟
    if (min === '*') {
      explanations.push(t('nav.tools.time.cron.explanation.minute.every'));
    } else if (min.includes('/')) {
      const [, interval] = min.split('/');
      explanations.push(t('nav.tools.time.cron.explanation.minute.interval', { interval }));
    } else if (min.includes('-')) {
      const [start, end] = min.split('-');
      explanations.push(t('nav.tools.time.cron.explanation.minute.range', { start, end }));
    } else if (min.includes(',')) {
      const values = min.split(',');
      explanations.push(t('nav.tools.time.cron.explanation.minute.specific', { values: values.join(', ') }));
    } else {
      explanations.push(t('nav.tools.time.cron.explanation.minute.specific', { values: min }));
    }

    // 解释小时
    if (hr === '*') {
      explanations.push(t('nav.tools.time.cron.explanation.hour.every'));
    } else if (hr.includes('/')) {
      const [, interval] = hr.split('/');
      explanations.push(t('nav.tools.time.cron.explanation.hour.interval', { interval }));
    } else if (hr.includes('-')) {
      const [start, end] = hr.split('-');
      explanations.push(t('nav.tools.time.cron.explanation.hour.range', { start, end }));
    } else if (hr.includes(',')) {
      const values = hr.split(',');
      explanations.push(t('nav.tools.time.cron.explanation.hour.specific', { values: values.join(', ') }));
    } else {
      explanations.push(t('nav.tools.time.cron.explanation.hour.specific', { values: hr }));
    }

    // 解释日期
    if (dayMonth === '*') {
      explanations.push(t('nav.tools.time.cron.explanation.dayOfMonth.every'));
    } else if (dayMonth === '?') {
      explanations.push(t('nav.tools.time.cron.explanation.dayOfMonth.any'));
    } else if (dayMonth.includes('/')) {
      const [, interval] = dayMonth.split('/');
      explanations.push(t('nav.tools.time.cron.explanation.dayOfMonth.interval', { interval }));
    } else if (dayMonth.includes('-')) {
      const [start, end] = dayMonth.split('-');
      explanations.push(t('nav.tools.time.cron.explanation.dayOfMonth.range', { start, end }));
    } else if (dayMonth.includes(',')) {
      const values = dayMonth.split(',');
      explanations.push(t('nav.tools.time.cron.explanation.dayOfMonth.specific', { values: values.join(', ') }));
    } else {
      explanations.push(t('nav.tools.time.cron.explanation.dayOfMonth.specific', { values: dayMonth }));
    }

    // 解释月份
    if (mon === '*') {
      explanations.push(t('nav.tools.time.cron.explanation.month.every'));
    } else if (mon.includes('/')) {
      const [, interval] = mon.split('/');
      explanations.push(t('nav.tools.time.cron.explanation.month.interval', { interval }));
    } else if (mon.includes('-')) {
      const [start, end] = mon.split('-');
      explanations.push(t('nav.tools.time.cron.explanation.month.range', { start, end }));
    } else if (mon.includes(',')) {
      const values = mon.split(',');
      explanations.push(t('nav.tools.time.cron.explanation.month.specific', { values: values.join(', ') }));
    } else {
      explanations.push(t('nav.tools.time.cron.explanation.month.specific', { values: mon }));
    }

    // 解释星期
    if (dayWeek === '*') {
      explanations.push(t('nav.tools.time.cron.explanation.dayOfWeek.every'));
    } else if (dayWeek === '?') {
      explanations.push(t('nav.tools.time.cron.explanation.dayOfWeek.any'));
    } else if (dayWeek.includes('/')) {
      const [, interval] = dayWeek.split('/');
      explanations.push(t('nav.tools.time.cron.explanation.dayOfWeek.interval', { interval }));
    } else if (dayWeek.includes('-')) {
      const [start, end] = dayWeek.split('-');
      explanations.push(t('nav.tools.time.cron.explanation.dayOfWeek.range', { start, end }));
    } else if (dayWeek.includes(',')) {
      const values = dayWeek.split(',');
      explanations.push(t('nav.tools.time.cron.explanation.dayOfWeek.specific', { values: values.join(', ') }));
    } else {
      explanations.push(t('nav.tools.time.cron.explanation.dayOfWeek.specific', { values: dayWeek }));
    }

    return explanations.join(' ');
  };

  // 生成 cron 表达式
  const generateCronExpression = () => {
    const cron = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
    setCronExpression(cron);
    setError('');
    
    // 自动解释生成的表达式
    const exp = explainCronExpression(cron);
    setExplanation(exp);
  };

  // 解释输入的 cron 表达式
  const handleExplain = () => {
    setError('');
    if (!cronExpression.trim()) {
      setError(t('nav.tools.time.cron.errors.empty'));
      setExplanation('');
      return;
    }

    if (!validateCronExpression(cronExpression)) {
      setError(t('nav.tools.time.cron.errors.invalid'));
      setExplanation('');
      return;
    }

    const exp = explainCronExpression(cronExpression);
    setExplanation(exp);
  };

  // 使用预设
  const handlePresetSelect = (presetValue) => {
    const parts = presetValue.split(/\s+/);
    setMinute(parts[0]);
    setHour(parts[1]);
    setDayOfMonth(parts[2]);
    setMonth(parts[3]);
    setDayOfWeek(parts[4]);
    setCronExpression(presetValue);
    setError('');
    const exp = explainCronExpression(presetValue);
    setExplanation(exp);
  };

  // 复制到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // 可以添加提示
    }).catch(() => {
      // 处理错误
    });
  };

  useEffect(() => {
    if (mode === 'generate') {
      generateCronExpression();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minute, hour, dayOfMonth, month, dayOfWeek, mode]);

  return (
    <>
      <Helmet>
        <title>{t('nav.tools.time.cron.seo.title')}</title>
        <meta name="description" content={t('nav.tools.time.cron.seo.description')} />
        <meta name="keywords" content={t('nav.tools.time.cron.seo.keywords')} />
      </Helmet>
      <div className="cron-container">
        {/* Tab 切换 */}
        <div className="cron-tabs">
          <button
            className={`cron-tab ${mode === 'generate' ? 'active' : ''}`}
            onClick={() => setMode('generate')}
          >
            {t('nav.tools.time.cron.modes.generate')}
          </button>
          <button
            className={`cron-tab ${mode === 'explain' ? 'active' : ''}`}
            onClick={() => setMode('explain')}
          >
            {t('nav.tools.time.cron.modes.explain')}
          </button>
        </div>

        {/* 生成模式 */}
        {mode === 'generate' && (
          <div className="cron-section">
            {/* Cron 表达式字段 */}
            <div className="cron-fields">
              <div className="cron-field">
                <label>{t('nav.tools.time.cron.fields.minute')}</label>
                <input
                  type="text"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  placeholder="*"
                  className="cron-input"
                />
                <span className="field-hint">{t('nav.tools.time.cron.fields.minuteHint')}</span>
              </div>

              <div className="cron-field">
                <label>{t('nav.tools.time.cron.fields.hour')}</label>
                <input
                  type="text"
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  placeholder="*"
                  className="cron-input"
                />
                <span className="field-hint">{t('nav.tools.time.cron.fields.hourHint')}</span>
              </div>

              <div className="cron-field">
                <label>{t('nav.tools.time.cron.fields.dayOfMonth')}</label>
                <input
                  type="text"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  placeholder="*"
                  className="cron-input"
                />
                <span className="field-hint">{t('nav.tools.time.cron.fields.dayOfMonthHint')}</span>
              </div>

              <div className="cron-field">
                <label>{t('nav.tools.time.cron.fields.month')}</label>
                <input
                  type="text"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  placeholder="*"
                  className="cron-input"
                />
                <span className="field-hint">{t('nav.tools.time.cron.fields.monthHint')}</span>
              </div>

              <div className="cron-field">
                <label>{t('nav.tools.time.cron.fields.dayOfWeek')}</label>
                <input
                  type="text"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  placeholder="*"
                  className="cron-input"
                />
                <span className="field-hint">{t('nav.tools.time.cron.fields.dayOfWeekHint')}</span>
              </div>
            </div>

            {/* 生成的 Cron 表达式 */}
            <div className="cron-result">
              <label>{t('nav.tools.time.cron.result.label')}:</label>
              <div className="result-box">
                <code className="cron-expression">{cronExpression}</code>
                <button
                  className="copy-button"
                  onClick={() => copyToClipboard(cronExpression)}
                  title={t('nav.tools.time.cron.buttons.copy')}
                >
                  {t('nav.tools.time.cron.buttons.copy')}
                </button>
              </div>
            </div>

            {/* 预设选项 - 移到下面 */}
            <div className="presets-section">
              <label>{t('nav.tools.time.cron.presets.label')}:</label>
              <div className="presets-grid">
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    className="preset-button"
                    onClick={() => handlePresetSelect(preset.value)}
                  >
                    {preset.label}
                    <span className="preset-value">{preset.value}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 解释模式 */}
        {mode === 'explain' && (
          <div className="cron-section">
            <div className="input-section">
              <label>{t('nav.tools.time.cron.explain.inputLabel')}:</label>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="0 9 * * 1-5"
                className="cron-input-large"
              />
              <button
                className="explain-button"
                onClick={handleExplain}
              >
                {t('nav.tools.time.cron.buttons.explain')}
              </button>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {explanation && !error && (
              <div className="explanation-section">
                <label>{t('nav.tools.time.cron.explain.resultLabel')}:</label>
                <div className="explanation-box">
                  {explanation}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 通用说明 */}
        <div className="cron-info">
          <h3>{t('nav.tools.time.cron.info.title')}</h3>
          <div className="info-content">
            <p>{t('nav.tools.time.cron.info.format')}</p>
            <ul>
              <li><code>*</code> - {t('nav.tools.time.cron.info.asterisk')}</li>
              <li><code>?</code> - {t('nav.tools.time.cron.info.question')}</li>
              <li><code>-</code> - {t('nav.tools.time.cron.info.dash')}</li>
              <li><code>,</code> - {t('nav.tools.time.cron.info.comma')}</li>
              <li><code>/</code> - {t('nav.tools.time.cron.info.slash')}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default CronExpression;

