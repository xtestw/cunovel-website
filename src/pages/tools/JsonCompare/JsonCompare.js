import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import './JsonCompare.css';

const JsonCompare = () => {
  const { t } = useTranslation();
  const [json1, setJson1] = useState('');
  const [json2, setJson2] = useState('');
  const [differences, setDifferences] = useState([]);
  const [error, setError] = useState('');

  const compareJson = () => {
    setError('');
    setDifferences([]);

    try {
      const obj1 = JSON.parse(json1);
      const obj2 = JSON.parse(json2);
      const diffs = findDifferences(obj1, obj2);
      setDifferences(diffs);
    } catch (e) {
      setError(t('nav.tools.jsonCompare.error'));
    }
  };

  const findDifferences = (obj1, obj2, path = '') => {
    const differences = [];

    // 检查obj1中的所有键
    for (const key in obj1) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!(key in obj2)) {
        differences.push({
          path: currentPath,
          type: 'missing_in_second',
          value1: obj1[key],
          value2: undefined
        });
        continue;
      }

      if (typeof obj1[key] !== typeof obj2[key]) {
        differences.push({
          path: currentPath,
          type: 'type_mismatch',
          value1: obj1[key],
          value2: obj2[key]
        });
        continue;
      }

      if (typeof obj1[key] === 'object' && obj1[key] !== null) {
        differences.push(...findDifferences(obj1[key], obj2[key], currentPath));
      } else if (obj1[key] !== obj2[key]) {
        differences.push({
          path: currentPath,
          type: 'value_mismatch',
          value1: obj1[key],
          value2: obj2[key]
        });
      }
    }

    // 检查obj2中存在但obj1中不存在的键
    for (const key in obj2) {
      if (!(key in obj1)) {
        const currentPath = path ? `${path}.${key}` : key;
        differences.push({
          path: currentPath,
          type: 'missing_in_first',
          value1: undefined,
          value2: obj2[key]
        });
      }
    }

    return differences;
  };

  return (
    <>
      <Helmet>
        <title>JSON对比工具 | CuTool</title>
        <meta 
          name="description" 
          content="在线JSON对比工具,快速找出两个JSON数据的差异,支持深层对比和类型检查" 
        />
        <meta 
          name="keywords" 
          content="JSON对比,JSON比较,JSON差异,JSON验证,在线工具" 
        />
      </Helmet>
      <div className="json-compare-container">
        <div className="input-panels">
          <div className="input-panel">
            <h3>{t('nav.tools.jsonCompare.firstJson')}</h3>
            <textarea
              value={json1}
              onChange={(e) => setJson1(e.target.value)}
              placeholder={t('nav.tools.jsonCompare.inputPlaceholder1')}
              spellCheck="false"
            />
          </div>
          <div className="input-panel">
            <h3>{t('nav.tools.jsonCompare.secondJson')}</h3>
            <textarea
              value={json2}
              onChange={(e) => setJson2(e.target.value)}
              placeholder={t('nav.tools.jsonCompare.inputPlaceholder2')}
              spellCheck="false"
            />
          </div>
        </div>

        <div className="compare-actions">
          <button onClick={compareJson} className="compare-button">
            {t('nav.tools.jsonCompare.compareButton')}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {differences.length > 0 ? (
          <div className="differences-section">
            <h3>{t('nav.tools.jsonCompare.differencesList')}</h3>
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
                    <td>{t(`nav.tools.jsonCompare.diffTypes.${diff.type}`)}</td>
                    <td>{JSON.stringify(diff.value1)}</td>
                    <td>{JSON.stringify(diff.value2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : differences.length === 0 && !error ? (
          <div className="no-differences">
            {t('nav.tools.jsonCompare.noDifferences')}
          </div>
        ) : null}
      </div>
    </>
  );
};

export default JsonCompare; 