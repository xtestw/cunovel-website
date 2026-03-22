'use client';

import { Suspense } from 'react';
import NewsDetail from '@/screens/AIDaily/NewsDetail';

export default function AiDailyArticlePage() {
  return (
    <Suspense
      fallback={
        <div className="ai-daily-container" style={{ padding: 24, textAlign: 'center' }}>
          加载中…
        </div>
      }
    >
      <NewsDetail />
    </Suspense>
  );
}
