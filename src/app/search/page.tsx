import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchContent } from './search-content';

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">譜面検索</h1>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </div>
  );
}
