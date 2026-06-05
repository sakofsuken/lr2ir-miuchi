'use client';

import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { trpc } from '@/lib/trpc';

export function TableLevelCharts({ tableId, level }: { tableId: number; level: string }) {
  const { data, isLoading } = trpc.tables.getCharts.useQuery({
    tableId,
    level,
    page: 1,
    limit: 100,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return <p className="text-muted-foreground text-sm">譜面がありません</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>タイトル</TableHead>
            <TableHead>アーティスト</TableHead>
            <TableHead className="text-right">プレイ人数</TableHead>
            <TableHead className="text-right">クリアレート</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((chart) => {
            const clearRate =
              chart.playPeople > 0
                ? `${((chart.clearPeople / chart.playPeople) * 100).toFixed(1)}%`
                : '-';
            return (
              <TableRow key={chart.chartMd5}>
                <TableCell>
                  <Link href={`/charts/${chart.chartMd5}`} className="text-primary hover:underline">
                    {chart.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{chart.artist}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {chart.playPeople.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums">{clearRate}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
