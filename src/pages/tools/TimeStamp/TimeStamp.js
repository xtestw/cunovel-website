import React, { useState, useEffect } from 'react';
import './TimeStamp.css';

// 获取所有可用的时区
const timeZones = Intl.supportedValuesOf('timeZone');

const TimeStamp = () => {
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // 处理日期转时间戳
  const handleDateToTimestamp = () => {
    try {
      const dateTimeString = `${dateInput}T${timeInput || '00:00:00'}`;
      const timestamp = new Date(dateTimeString).getTime();
      if (isNaN(timestamp)) {
        throw new Error('Invalid date');
      }
      setDateTimestamp({
        ms: timestamp,
        s: Math.floor(timestamp / 1000)
      });
    } catch (e) {
      setDateTimestamp({ ms: '无效的日期', s: '无效的日期' });
    }
  };

  // 当日期或时间变化时自动更新时间戳
  useEffect(() => {
    handleDateToTimestamp();
  }, [dateInput, timeInput]);

  return (
    <div className="timestamp-container">
      {/* 当前时区和时间信息 */}
      <div className="section current-time">
        <h3>时区信息</h3>
        <div className="timezone-selector">
          <label>选择时区:</label>
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
            <label>当前时间戳(ms):</label>
            <span>{currentTimestamp}</span>
          </div>
          <div className="info-item">
            <label>当前时间戳(s):</label>
            <span>{Math.floor(currentTimestamp / 1000)}</span>
          </div>
          <div className="info-item">
            <label>当前时间:</label>
            <span>{formatDate(currentTimestamp, 'ms', selectedTimeZone)}</span>
          </div>
        </div>
      </div>

      {/* 时间戳转换 */}
      <div className="section timestamp-convert">
        <h3>时间戳转换</h3>
        <div className="convert-group">
          <div className="input-with-unit">
            <input
              type="text"
              value={inputTimestamp}
              onChange={(e) => setInputTimestamp(e.target.value)}
              placeholder="输入时间戳"
              className="timestamp-input"
            />
            <select 
              value={timestampUnit}
              onChange={(e) => setTimestampUnit(e.target.value)}
              className="unit-select"
            >
              <option value="ms">毫秒</option>
              <option value="s">秒</option>
            </select>
          </div>
          <button 
            onClick={() => setConvertedTime(formatDate(inputTimestamp, timestampUnit, selectedTimeZone))}
            className="convert-button"
          >
            转换
          </button>
        </div>
        {convertedTime && (
          <div className="converted-time">
            转换结果: {convertedTime}
          </div>
        )}
      </div>

      {/* 日期转时间戳 */}
      <div className="section date-to-timestamp">
        <h3>日期转时间戳</h3>
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
            <label>毫秒时间戳:</label>
            <span>{dateTimestamp.ms}</span>
          </div>
          <div className="result-item">
            <label>秒时间戳:</label>
            <span>{dateTimestamp.s}</span>
          </div>
        </div>
      </div>

      {/* 时间戳差值计算 */}
      <div className="section timestamp-diff">
        <h3>时间戳差值</h3>
        <div className="diff-inputs">
          <input
            type="text"
            value={timestamp1}
            onChange={(e) => setTimestamp1(e.target.value)}
            placeholder="时间戳1(毫秒)"
            className="timestamp-input"
          />
          <input
            type="text"
            value={timestamp2}
            onChange={(e) => setTimestamp2(e.target.value)}
            placeholder="时间戳2(毫秒)"
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
              setTimeDiff(`${days}天 ${hours % 24}小时 ${minutes % 60}分钟 ${seconds % 60}秒`);
            } catch (e) {
              setTimeDiff('计算错误');
            }
          }} className="calculate-button">
            计算差值
          </button>
        </div>
        {timeDiff && (
          <div className="diff-result">
            时间差: {timeDiff}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeStamp; 