'use client';

import { Suspense } from 'react';
import VerifyResult from '@/screens/VerifyResult/VerifyResult';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyResult />
    </Suspense>
  );
}
