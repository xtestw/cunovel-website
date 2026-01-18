import React, { useState, useEffect } from 'react';
import './CronExpression.css';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';

const CronExpression = () => {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState('generate'); // 'generate' or 'explain'
  const [cronExpression, setCronExpression] = useState('');
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');
  const [nextRuns, setNextRuns] = useState([]);
  const [calculatingRuns, setCalculatingRuns] = useState(false);

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
    
    // 计算下一个触发时间
    updateNextRuns(cron);
  };

  // 解释输入的 cron 表达式
  const handleExplain = () => {
    setError('');
    if (!cronExpression.trim()) {
      setError(t('nav.tools.time.cron.errors.empty'));
      setExplanation('');
      setNextRuns([]);
      return;
    }

    if (!validateCronExpression(cronExpression)) {
      setError(t('nav.tools.time.cron.errors.invalid'));
      setExplanation('');
      setNextRuns([]);
      return;
    }

    const exp = explainCronExpression(cronExpression);
    setExplanation(exp);
    
    // 计算下一个触发时间
    updateNextRuns(cronExpression);
  };

  // 更新下一个触发时间
  const updateNextRuns = (cron) => {
    setCalculatingRuns(true);
    try {
      // 使用 setTimeout 避免阻塞 UI
      setTimeout(() => {
        const runs = calculateNextRuns(cron, 5);
        setNextRuns(runs);
        setCalculatingRuns(false);
      }, 0);
    } catch (err) {
      console.error('Error calculating next runs:', err);
      setNextRuns([]);
      setCalculatingRuns(false);
    }
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
    updateNextRuns(presetValue);
  };

  // 复制到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // 可以添加提示
    }).catch(() => {
      // 处理错误
    });
  };

  // 解析 cron 字段值，返回匹配的值数组
  const parseCronField = (field, min, max) => {
    if (field === '*' || field === '?') {
      const result = [];
      for (let i = min; i <= max; i++) {
        result.push(i);
      }
      return result;
    }

    if (field.includes(',')) {
      const values = field.split(',').map(v => parseInt(v.trim()));
      return values.filter(v => !isNaN(v) && v >= min && v <= max);
    }

    if (field.includes('-')) {
      const [start, end] = field.split('-').map(v => parseInt(v.trim()));
      if (isNaN(start) || isNaN(end)) return [];
      const result = [];
      for (let i = Math.max(min, start); i <= Math.min(max, end); i++) {
        result.push(i);
      }
      return result;
    }

    if (field.includes('/')) {
      const [base, interval] = field.split('/');
      const intervalNum = parseInt(interval);
      if (isNaN(intervalNum) || intervalNum <= 0) return [];
      
      const start = base === '*' ? min : parseInt(base);
      if (isNaN(start)) return [];
      
      const result = [];
      for (let i = start; i <= max; i += intervalNum) {
        if (i >= min && i <= max) {
          result.push(i);
        }
      }
      return result;
    }

    const value = parseInt(field);
    if (!isNaN(value) && value >= min && value <= max) {
      return [value];
    }

    return [];
  };

  // 计算下一个触发时间
  const calculateNextRuns = (cron, count = 5) => {
    if (!validateCronExpression(cron)) {
      return [];
    }

    const parts = cron.trim().split(/\s+/);
    const [minuteField, hourField, dayOfMonthField, monthField, dayOfWeekField] = parts;

    const now = new Date();
    const results = [];
    let currentDate = new Date(now);
    currentDate.setSeconds(0);
    currentDate.setMilliseconds(0);
    currentDate.setMinutes(currentDate.getMinutes() + 1); // 从下一分钟开始

    // 最多尝试 2000 次（约 3-4 年）
    let attempts = 0;
    const maxAttempts = 2000;

    while (results.length < count && attempts < maxAttempts) {
      attempts++;
      
      // 获取当前时间的各个部分
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // 0-11 -> 1-12
      const day = currentDate.getDate();
      const hour = currentDate.getHours();
      const minute = currentDate.getMinutes();
      const dayOfWeek = currentDate.getDay();

      // 解析各个字段
      const validMonths = parseCronField(monthField, 1, 12);
      const validDaysOfMonth = parseCronField(dayOfMonthField, 1, 31);
      const validDaysOfWeek = parseCronField(dayOfWeekField, 0, 6);
      const validHours = parseCronField(hourField, 0, 23);
      const validMinutes = parseCronField(minuteField, 0, 59);

      // 检查月份
      if (!validMonths.includes(month)) {
        const nextMonth = validMonths.find(m => m > month);
        if (nextMonth !== undefined) {
          currentDate.setMonth(nextMonth - 1);
          currentDate.setDate(1);
          currentDate.setHours(0);
          currentDate.setMinutes(0);
        } else {
          // 跳到下一年的第一个有效月份
          currentDate.setFullYear(year + 1);
          currentDate.setMonth(validMonths[0] - 1);
          currentDate.setDate(1);
          currentDate.setHours(0);
          currentDate.setMinutes(0);
        }
        continue;
      }

      // 检查日期和星期
      const daysInMonth = new Date(year, month, 0).getDate();
      let dayValid = false;
      
      // 如果 dayOfMonth 和 dayOfWeek 都指定了，需要满足其中一个（cron 的 OR 逻辑）
      if (dayOfMonthField !== '*' && dayOfMonthField !== '?') {
        if (dayOfWeekField !== '*' && dayOfWeekField !== '?') {
          // 两者都指定，满足其中一个即可
          dayValid = (validDaysOfMonth.includes(day) && day <= daysInMonth) || 
                     validDaysOfWeek.includes(dayOfWeek);
        } else {
          // 只指定了日期
          dayValid = validDaysOfMonth.includes(day) && day <= daysInMonth;
        }
      } else if (dayOfWeekField !== '*' && dayOfWeekField !== '?') {
        // 只指定了星期
        dayValid = validDaysOfWeek.includes(dayOfWeek);
      } else {
        // 都没有指定，任意日期
        dayValid = day <= daysInMonth;
      }

      if (!dayValid) {
        currentDate.setDate(day + 1);
        currentDate.setHours(0);
        currentDate.setMinutes(0);
        continue;
      }

      // 检查小时
      if (!validHours.includes(hour)) {
        const nextHour = validHours.find(h => h > hour);
        if (nextHour !== undefined) {
          currentDate.setHours(nextHour);
          currentDate.setMinutes(0);
        } else {
          // 跳到下一天的第一个有效小时
          currentDate.setDate(day + 1);
          currentDate.setHours(validHours[0] || 0);
          currentDate.setMinutes(0);
        }
        continue;
      }

      // 检查分钟
      if (!validMinutes.includes(minute)) {
        const nextMinute = validMinutes.find(m => m > minute);
        if (nextMinute !== undefined) {
          currentDate.setMinutes(nextMinute);
        } else {
          const nextHour = validHours.find(h => h > hour);
          if (nextHour !== undefined) {
            currentDate.setHours(nextHour);
            currentDate.setMinutes(validMinutes[0] || 0);
          } else {
            // 跳到下一天
            currentDate.setDate(day + 1);
            currentDate.setHours(validHours[0] || 0);
            currentDate.setMinutes(validMinutes[0] || 0);
          }
        }
        continue;
      }

      // 找到匹配的时间
      results.push(new Date(currentDate));
      
      // 移动到下一分钟继续查找
      currentDate.setMinutes(minute + 1);
    }

    return results;
  };

  // 格式化日期时间
  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const isZh = i18n.language.startsWith('zh');
    const weekday = isZh ? weekdays[date.getDay()] : weekdaysEn[date.getDay()];
    
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
      weekday: weekday,
      full: `${year}-${month}-${day} ${hours}:${minutes} (${weekday})`
    };
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

            {/* 下一个触发时间 */}
            {cronExpression && validateCronExpression(cronExpression) && (
              <div className="next-runs-section">
                <label>{t('nav.tools.time.cron.nextRuns.title')}:</label>
                {calculatingRuns ? (
                  <div className="next-runs-loading">{t('nav.tools.time.cron.nextRuns.loading')}</div>
                ) : nextRuns.length > 0 ? (
                  <div className="next-runs-list">
                    {nextRuns.map((date, index) => {
                      const formatted = formatDateTime(date);
                      return (
                        <div key={index} className="next-run-item">
                          <span className="next-run-date">{formatted.date}</span>
                          <span className="next-run-time">{formatted.time}</span>
                          <span className="next-run-weekday">{formatted.weekday}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="next-runs-error">{t('nav.tools.time.cron.nextRuns.error')}</div>
                )}
              </div>
            )}

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

            {/* 下一个触发时间 */}
            {cronExpression && !error && validateCronExpression(cronExpression) && (
              <div className="next-runs-section">
                <label>{t('nav.tools.time.cron.nextRuns.title')}:</label>
                {calculatingRuns ? (
                  <div className="next-runs-loading">{t('nav.tools.time.cron.nextRuns.loading')}</div>
                ) : nextRuns.length > 0 ? (
                  <div className="next-runs-list">
                    {nextRuns.map((date, index) => {
                      const formatted = formatDateTime(date);
                      return (
                        <div key={index} className="next-run-item">
                          <span className="next-run-date">{formatted.date}</span>
                          <span className="next-run-time">{formatted.time}</span>
                          <span className="next-run-weekday">{formatted.weekday}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="next-runs-error">{t('nav.tools.time.cron.nextRuns.error')}</div>
                )}
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

