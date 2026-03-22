'use client';

import { Suspense } from 'react';
import PhoneVerify from '@/screens/PhoneVerify/PhoneVerify';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PhoneVerify />
    </Suspense>
  );
}
