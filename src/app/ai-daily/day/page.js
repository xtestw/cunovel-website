'use client';

import { Suspense } from 'react';
import AIDailyDetail from '@/screens/AIDaily/AIDailyDetail';

export default function AiDailyDayPage() {
  return (
    <Suspense
      fallback={
        <div className="ai-daily-container" style={{ padding: 24, textAlign: 'center' }}>
          加载中…
        </div>
      }
    >
      <AIDailyDetail />
    </Suspense>
  );
}
