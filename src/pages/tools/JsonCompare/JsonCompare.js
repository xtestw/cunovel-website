import React, { useState } from 'react';
import './JsonCompare.css';

const JsonCompare = () => {
  const [json1, setJson1] = useState('');
  const [json2, setJson2] = useState('');
  const [differences, setDifferences] = useState(null);
  const [error, setError] = useState('');

  // 比较两个对象的差异
  const compareObjects = (obj1, obj2, path = '') => {
    const differences = [];

    // 检查 obj1 中的所有键
    Object.keys(obj1).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!(key in obj2)) {
        differences.push({
          path: currentPath,
          type: 'missing_in_second',
          value1: obj1[key],
          value2: undefined
        });
        return;
      }

      if (typeof obj1[key] !== typeof obj2[key]) {
        differences.push({
          path: currentPath,
          type: 'type_mismatch',
          value1: obj1[key],
          value2: obj2[key]
        });
        return;
      }

      if (typeof obj1[key] === 'object' && obj1[key] !== null) {
        // 递归比较对象或数组
        differences.push(...compareObjects(obj1[key], obj2[key], currentPath));
      } else if (obj1[key] !== obj2[key]) {
        differences.push({
          path: currentPath,
          type: 'value_mismatch',
          value1: obj1[key],
          value2: obj2[key]
        });
      }
    });

    // 检查 obj2 中的额外键
    Object.keys(obj2).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      if (!(key in obj1)) {
        differences.push({
          path: currentPath,
          type: 'missing_in_first',
          value1: undefined,
          value2: obj2[key]
        });
      }
    });

    return differences;
  };

  const handleCompare = () => {
    try {
      setError('');
      const obj1 = JSON.parse(json1);
      const obj2 = JSON.parse(json2);
      const diffs = compareObjects(obj1, obj2);
      setDifferences(diffs);
    } catch (e) {
      setError('JSON 格式错误，请检查输入');
      setDifferences(null);
    }
  };

  const formatValue = (value) => {
    if (value === undefined) return 'undefined';
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  };

  const getDiffTypeText = (type) => {
    switch (type) {
      case 'missing_in_first': return '仅在第二个 JSON 中存在';
      case 'missing_in_second': return '仅在第一个 JSON 中存在';
      case 'type_mismatch': return '类型不匹配';
      case 'value_mismatch': return '值不同';
      default: return '';
    }
  };

  return (
    <div className="json-compare-container">
      <div className="input-section">
        <div className="json-input-group">
          <h3>第一个 JSON</h3>
          <textarea
            value={json1}
            onChange={(e) => setJson1(e.target.value)}
            placeholder="输入第一个 JSON"
            className="json-input"
          />
        </div>
        <div className="json-input-group">
          <h3>第二个 JSON</h3>
          <textarea
            value={json2}
            onChange={(e) => setJson2(e.target.value)}
            placeholder="输入第二个 JSON"
            className="json-input"
          />
        </div>
      </div>
      <div className="compare-button-container">
        <button onClick={handleCompare} className="compare-button">
          比较
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {differences && (
        <div className="differences-section">
          <h3>差异列表</h3>
          {differences.length === 0 ? (
            <div className="no-differences">两个 JSON 完全相同</div>
          ) : (
            <table className="differences-table">
              <thead>
                <tr>
                  <th>路径</th>
                  <th>差异类型</th>
                  <th>第一个 JSON 的值</th>
                  <th>第二个 JSON 的值</th>
                </tr>
              </thead>
              <tbody>
                {differences.map((diff, index) => (
                  <tr key={index}>
                    <td>{diff.path}</td>
                    <td>{getDiffTypeText(diff.type)}</td>
                    <td className="value-cell">{formatValue(diff.value1)}</td>
                    <td className="value-cell">{formatValue(diff.value2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default JsonCompare; 