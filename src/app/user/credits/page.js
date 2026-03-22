'use client';

import { Suspense } from 'react';
import UserCredits from '@/screens/UserCredits/UserCredits';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <UserCredits />
    </Suspense>
  );
}
