'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { PaginationNav } from '@/components/pagination-nav';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { clearColors, clearLabels } from '@/lib/clear-types';
import { trpc } from '@/lib/trpc';

const CLEAR_FILTERS = [
  { label: 'ALL', value: undefined },
  { label: 'FC', value: 5 },
  { label: 'Hard', value: 4 },
  { label: 'Normal', value: 3 },
  { label: 'Easy', value: 2 },
  { label: 'Failed', value: 1 },
] as const;

export function ScoreList({ playerId }: { playerId: number }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = Number(searchParams.get('page')) || 1;
  const clearFilter = searchParams.get('clear');
  const clearValue = clearFilter !== null ? Number(clearFilter) : undefined;

  const { data, isLoading } = trpc.players.getScores.useQuery({
    playerId,
    clear: clearValue,
    page,
    limit: 50,
  });

  const totalPages = data ? Math.ceil(data.total / 50) : 0;

  function buildHref(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set('page', String(p));
    if (clearValue !== undefined) params.set('clear', String(clearValue));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function handleClearFilter(value: number | undefined) {
    const params = new URLSearchParams();
    if (value !== undefined) params.set('clear', String(value));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">クリア種別:</span>
        {CLEAR_FILTERS.map((filter) => (
          <Button
            key={filter.label}
            variant={clearValue === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleClearFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
        {data && (
          <span className="ml-auto text-sm text-muted-foreground">
            {data.total.toLocaleString()} 件
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>曲名</TableHead>
                  <TableHead>クリア</TableHead>
                  <TableHead className="text-right">EXスコア</TableHead>
                  <TableHead className="text-right">コンボ</TableHead>
                  <TableHead className="text-right">BP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((score) => (
                  <TableRow key={score.songMd5}>
                    <TableCell>
                      <Link
                        href={`/charts/${score.songMd5}`}
                        className="text-primary hover:underline"
                      >
                        {score.chartTitle}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className={clearColors[score.clear] ?? ''}>
                        {clearLabels[score.clear] ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {score.exscore}
                      {score.scoreMax ? (
                        <span className="text-muted-foreground">/{score.scoreMax}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {score.maxcombo}
                      {score.comboMax ? (
                        <span className="text-muted-foreground">/{score.comboMax}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{score.minbp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationNav currentPage={page} totalPages={totalPages} buildHref={buildHref} />
        </>
      ) : (
        <p className="text-muted-foreground text-sm">スコアデータがありません</p>
      )}
    </div>
  );
}
