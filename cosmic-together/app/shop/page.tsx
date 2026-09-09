import { Suspense } from 'react';
import { Shop } from '@/components/shop';
export default function Page() {
  return (
    <Suspense
      fallback={<p className="page-loading">Opening your shopping space…</p>}
    >
      <Shop />
    </Suspense>
  );
}
