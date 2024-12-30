import React, { useState, useEffect } from 'react';
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
    <div className="tool-component">
      <h2>文本对比工具</h2>
      <div className="text-compare-container">
        <div className="text-inputs">
          <div className="text-input-area">
            <h3>文本 1</h3>
            <textarea
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              placeholder="请输入第一段文本"
              spellCheck="false"
            />
          </div>
          <div className="text-input-area">
            <h3>文本 2</h3>
            <textarea
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              placeholder="请输入第二段文本"
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
              leftTitle="文本 1"
              rightTitle="文本 2"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default TextCompare; 