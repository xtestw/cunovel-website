import React, { useState } from 'react';
import './JsonCompare.css';
import { useTranslation } from 'react-i18next';

const JsonCompare = () => {
  const { t } = useTranslation();
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
      setError(t('nav.tools.jsonCompare.error'));
      setDifferences(null);
    }
  };

  const formatValue = (value) => {
    if (value === undefined) return 'undefined';
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  };

  const getDiffTypeText = (type) => {
    return t(`nav.tools.jsonCompare.diffTypes.${type}`);
  };

  return (
    <div className="json-compare-container">
      <div className="input-section">
        <div className="json-input-group">
          <h3>{t('nav.tools.jsonCompare.firstJson')}</h3>
          <textarea
            value={json1}
            onChange={(e) => setJson1(e.target.value)}
            placeholder={t('nav.tools.jsonCompare.inputPlaceholder1')}
            className="json-input"
          />
        </div>
        <div className="json-input-group">
          <h3>{t('nav.tools.jsonCompare.secondJson')}</h3>
          <textarea
            value={json2}
            onChange={(e) => setJson2(e.target.value)}
            placeholder={t('nav.tools.jsonCompare.inputPlaceholder2')}
            className="json-input"
          />
        </div>
      </div>
      <div className="compare-button-container">
        <button onClick={handleCompare} className="compare-button">
          {t('nav.tools.jsonCompare.compareButton')}
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {differences && (
        <div className="differences-section">
          <h3>{t('nav.tools.jsonCompare.differencesList')}</h3>
          {differences.length === 0 ? (
            <div className="no-differences">{t('nav.tools.jsonCompare.noDifferences')}</div>
          ) : (
            <table className="differences-table">
              <thead>
                <tr>
                  <th>{t('nav.tools.jsonCompare.table.path')}</th>
                  <th>{t('nav.tools.jsonCompare.table.diffType')}</th>
                  <th>{t('nav.tools.jsonCompare.table.firstValue')}</th>
                  <th>{t('nav.tools.jsonCompare.table.secondValue')}</th>
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