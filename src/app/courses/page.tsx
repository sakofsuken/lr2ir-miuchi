import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { CoursesContent } from './courses-content';

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">段位認定</h1>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <CoursesContent />
      </Suspense>
    </div>
  );
}
