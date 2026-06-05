'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { PaginationNav } from '@/components/pagination-nav';
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

export function CourseRankingTable({ courseId }: { courseId: number }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const page = Number(searchParams.get('page')) || 1;

  const { data, isLoading } = trpc.courses.getRanking.useQuery({
    courseId,
    page,
    limit: 100,
  });

  const totalPages = data ? Math.ceil(data.total / 100) : 0;

  function buildHref(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return <p className="text-muted-foreground text-sm">スコアデータがありません</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{data.total.toLocaleString()} 件</p>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>プレイヤー</TableHead>
              <TableHead>段位</TableHead>
              <TableHead>クリア</TableHead>
              <TableHead className="text-right">EXスコア</TableHead>
              <TableHead className="text-right">コンボ</TableHead>
              <TableHead className="text-right">BP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((score, index) => (
              <TableRow key={score.playerId}>
                <TableCell className="font-medium">{(page - 1) * 100 + index + 1}</TableCell>
                <TableCell>
                  <Link
                    href={`/players/${score.playerId}`}
                    className="text-primary hover:underline"
                  >
                    {score.playerName}
                  </Link>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {score.playerDanSp ?? '-'}
                </TableCell>
                <TableCell>
                  <span className={clearColors[score.clear] ?? ''}>
                    {clearLabels[score.clear] ?? '-'}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{score.exscore}</TableCell>
                <TableCell className="text-right tabular-nums">{score.maxcombo}</TableCell>
                <TableCell className="text-right tabular-nums">{score.minbp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationNav currentPage={page} totalPages={totalPages} buildHref={buildHref} />
    </div>
  );
}
