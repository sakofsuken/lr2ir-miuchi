import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { BbsContent } from './bbs-content';

export default function BbsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">BBS</h1>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <BbsContent />
      </Suspense>
    </div>
  );
}
