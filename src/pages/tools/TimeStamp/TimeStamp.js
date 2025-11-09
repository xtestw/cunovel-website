import React, { useState, useEffect, useCallback } from 'react';
import './TimeStamp.css';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';

// 获取所有可用的时区
const timeZones = Intl.supportedValuesOf('timeZone');

const TimeStamp = () => {
  const { t } = useTranslation();
  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now());
  const [selectedTimeZone, setSelectedTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [inputTimestamp, setInputTimestamp] = useState('');
  const [timestampUnit, setTimestampUnit] = useState('ms');
  const [convertedTime, setConvertedTime] = useState('');
  const [timestamp1, setTimestamp1] = useState('');
  const [timestamp2, setTimestamp2] = useState('');
  const [timeDiff, setTimeDiff] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [dateTimestamp, setDateTimestamp] = useState({
    ms: new Date().getTime(),
    s: Math.floor(new Date().getTime() / 1000)
  });

  // 处理日期转时间戳
  const handleDateToTimestamp = useCallback(() => {
    try {
      if (!dateInput) {
        setDateTimestamp({ ms: '', s: '' });
        return;
      }
      
      // 如果没有时间输入，使用当前时间
      const timeString = timeInput || new Date().toTimeString().slice(0, 8);
      const dateTimeString = `${dateInput}T${timeString}`;
      const timestamp = new Date(dateTimeString).getTime();
      
      if (isNaN(timestamp)) {
        throw new Error('Invalid date');
      }
      
      setDateTimestamp({
        ms: timestamp,
        s: Math.floor(timestamp / 1000)
      });
    } catch (e) {
      setDateTimestamp({ 
        ms: t('nav.tools.timeStamp.errors.invalidTimestamp'), 
        s: t('nav.tools.timeStamp.errors.invalidTimestamp') 
      });
    }
  }, [dateInput, timeInput, t]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    handleDateToTimestamp();
  }, [dateInput, timeInput, t]);

  // 格式化时间（带时区）
  const formatDate = (timestamp, unit, timeZone) => {
    try {
      const milliseconds = unit === 's' ? Number(timestamp) * 1000 : Number(timestamp);
      return new Date(milliseconds).toLocaleString('zh-CN', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (e) {
      return '无效的时间戳';
    }
  };

  // 获取当前时区的时间偏移
  const getTimeZoneOffset = (timeZone) => {
    const date = new Date();
    const options = { timeZone, timeZoneName: 'short' };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const timeZoneString = formatter.format(date).split(' ').pop();
    return timeZoneString;
  };

  // 格式化时间差值的文本
  const formatTimeDiff = (days, hours, minutes, seconds) => {
    const { units } = t('nav.tools.timeStamp.timestampDiff', { returnObjects: true });
    return `${days}${units.days} ${hours % 24}${units.hours} ${minutes % 60}${units.minutes} ${seconds % 60}${units.seconds}`;
  };

  return (
    <>
      <Helmet>
        <title>时间戳转换工具 | Timestamp Converter - CUTool</title>
        <meta name="description" content="在线时间戳转换工具，支持时间戳与日期时间互转，多时区显示，时间差计算。Online timestamp converter with datetime conversion, timezone support and time difference calculation." />
        <meta name="keywords" content="timestamp converter, unix timestamp, datetime converter, timezone converter, 时间戳转换, Unix时间戳, 日期转换, 时区转换" />
      </Helmet>
      <div className="timestamp-container">
        {/* 当前时区和时间信息 */}
        <div className="section current-time">
          <h3>{t('nav.tools.timeStamp.timezoneInfo.title')}</h3>
          <div className="timezone-selector">
            <label>{t('nav.tools.timeStamp.timezoneInfo.selectLabel')}</label>
            <select 
              value={selectedTimeZone}
              onChange={(e) => setSelectedTimeZone(e.target.value)}
              className="timezone-select"
            >
              {timeZones.map(zone => (
                <option key={zone} value={zone}>
                  {zone} ({getTimeZoneOffset(zone)})
                </option>
              ))}
            </select>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <label>{t('nav.tools.timeStamp.timezoneInfo.currentTimestamp')}:</label>
              <span>{currentTimestamp}</span>
            </div>
            <div className="info-item">
              <label>{t('nav.tools.timeStamp.timezoneInfo.currentTimestampSeconds')}:</label>
              <span>{Math.floor(currentTimestamp / 1000)}</span>
            </div>
            <div className="info-item">
              <label>{t('nav.tools.timeStamp.timezoneInfo.currentTime')}:</label>
              <span>{formatDate(currentTimestamp, 'ms', selectedTimeZone)}</span>
            </div>
          </div>
        </div>

        {/* 时间戳转换 */}
        <div className="section timestamp-convert">
          <h3>{t('nav.tools.timeStamp.converter.title')}</h3>
          <div className="convert-group">
            <div className="input-with-unit">
              <input
                type="text"
                value={inputTimestamp}
                onChange={(e) => setInputTimestamp(e.target.value)}
                placeholder={t('nav.tools.timeStamp.converter.inputPlaceholder')}
                className="timestamp-input"
              />
              <select 
                value={timestampUnit}
                onChange={(e) => setTimestampUnit(e.target.value)}
                className="unit-select"
              >
                <option value="ms">{t('nav.tools.timeStamp.converter.units.milliseconds')}</option>
                <option value="s">{t('nav.tools.timeStamp.converter.units.seconds')}</option>
              </select>
            </div>
            <button 
              onClick={() => setConvertedTime(formatDate(inputTimestamp, timestampUnit, selectedTimeZone))}
              className="convert-button"
            >
              {t('nav.tools.timeStamp.converter.convertButton')}
            </button>
          </div>
          {convertedTime && (
            <div className="converted-time">
              {t('nav.tools.timeStamp.converter.result')}: {convertedTime}
            </div>
          )}
        </div>

        {/* 日期转时间戳 */}
        <div className="section date-to-timestamp">
          <h3>{t('nav.tools.timeStamp.dateToTimestamp.title')}</h3>
          <div className="date-inputs">
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="date-input"
            />
            <input
              type="time"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="time-input"
            />
          </div>
          <div className="timestamp-results">
            <div className="result-item">
              <label>{t('nav.tools.timeStamp.dateToTimestamp.timestampMs')}:</label>
              <span>{dateTimestamp.ms}</span>
            </div>
            <div className="result-item">
              <label>{t('nav.tools.timeStamp.dateToTimestamp.timestampS')}:</label>
              <span>{dateTimestamp.s}</span>
            </div>
          </div>
        </div>

        {/* 时间戳差值计算 */}
        <div className="section timestamp-diff">
          <h3>{t('nav.tools.timeStamp.timestampDiff.title')}</h3>
          <div className="diff-inputs">
            <input
              type="text"
              value={timestamp1}
              onChange={(e) => setTimestamp1(e.target.value)}
              placeholder={t('nav.tools.timeStamp.timestampDiff.timestamp1')}
              className="timestamp-input"
            />
            <input
              type="text"
              value={timestamp2}
              onChange={(e) => setTimestamp2(e.target.value)}
              placeholder={t('nav.tools.timeStamp.timestampDiff.timestamp2')}
              className="timestamp-input"
            />
            <button onClick={() => {
              if (!timestamp1 || !timestamp2) return;
              try {
                const diff = Math.abs(Number(timestamp2) - Number(timestamp1));
                const seconds = Math.floor(diff / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);
                setTimeDiff(formatTimeDiff(days, hours, minutes, seconds));
              } catch (e) {
                setTimeDiff(t('nav.tools.timeStamp.errors.calculationError'));
              }
            }} className="calculate-button">
              {t('nav.tools.timeStamp.timestampDiff.calculateButton')}
            </button>
          </div>
          {timeDiff && (
            <div className="diff-result">
              {t('nav.tools.timeStamp.timestampDiff.difference')}: {timeDiff}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TimeStamp; 