import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import ReactDiffViewer from 'react-diff-viewer';

function TextCompare() {
  const { t } = useTranslation();
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    if (text1 || text2) {
      setShowDiff(true);
    } else {
      setShowDiff(false);
    }
  }, [text1, text2]);

  return (
    <>
      <Helmet>
        <title>文本对比工具 | Text Compare - CUTool</title>
        <meta name="description" content="在线文本对比工具，支持逐字比较，突出显示差异。Online text comparison tool with word-by-word diff highlighting." />
        <meta name="keywords" content="text compare, text diff, text comparison, 文本对比, 文本比较" />
      </Helmet>

      <div className="tool-component">
        <h2>{t('nav.tools.textCompare.title')}</h2>
        <div className="text-compare-container">
          <div className="text-inputs">
            <div className="text-input-area">
              <h3>{t('nav.tools.textCompare.text1.title')}</h3>
              <textarea
                value={text1}
                onChange={(e) => setText1(e.target.value)}
                placeholder={t('nav.tools.textCompare.text1.placeholder')}
                spellCheck="false"
              />
            </div>
            <div className="text-input-area">
              <h3>{t('nav.tools.textCompare.text2.title')}</h3>
              <textarea
                value={text2}
                onChange={(e) => setText2(e.target.value)}
                placeholder={t('nav.tools.textCompare.text2.placeholder')}
                spellCheck="false"
              />
            </div>
          </div>

          {showDiff && (
            <div className="diff-viewer-container">
              <ReactDiffViewer
                oldValue={text1}
                newValue={text2}
                splitView={true}
                compareMethod="diffWords"
                useDarkTheme={false}
                styles={{
                  contentText: {
                    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace",
                    fontSize: '14px',
                    lineHeight: '1.6',
                  },
                  line: {
                    wordBreak: 'break-all',
                  },
                }}
                leftTitle={t('nav.tools.textCompare.diffViewer.leftTitle')}
                rightTitle={t('nav.tools.textCompare.diffViewer.rightTitle')}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default TextCompare; 