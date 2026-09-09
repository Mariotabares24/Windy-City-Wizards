import { Suspense } from 'react';
import { Shop } from '@/components/shop';
export default function Page() {
  return (
    <Suspense
      fallback={<p className="page-loading">Getting your demo ready…</p>}
    >
      <Shop demo />
    </Suspense>
  );
}
