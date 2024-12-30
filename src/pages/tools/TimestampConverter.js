import React, { useState } from 'react';

function TimestampConverter() {
  const [timestamp, setTimestamp] = useState('');
  const [dateTime, setDateTime] = useState('');

  const convertToDateTime = () => {
    try {
      const date = new Date(parseInt(timestamp) * 1000);
      setDateTime(date.toLocaleString());
    } catch (e) {
      setDateTime('转换错误，请检查输入');
    }
  };

  const getCurrentTimestamp = () => {
    const now = Math.floor(Date.now() / 1000);
    setTimestamp(now.toString());
  };

  return (
    <div className="tool-component">
      <h2>时间戳转换</h2>
      <div className="input-area">
        <input
          type="text"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          placeholder="请输入时间戳"
        />
        <div className="button-group">
          <button onClick={convertToDateTime}>转换为日期时间</button>
          <button onClick={getCurrentTimestamp}>获取当前时间戳</button>
        </div>
      </div>
      <div className="output-area">
        <h3>结果：</h3>
        <input
          type="text"
          value={dateTime}
          readOnly
        />
      </div>
    </div>
  );
}

export default TimestampConverter; 