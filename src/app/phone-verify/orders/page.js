'use client';

import { Suspense } from 'react';
import VehicleVerifyOrders from '@/screens/VehicleVerify/VehicleVerifyOrders';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VehicleVerifyOrders />
    </Suspense>
  );
}
