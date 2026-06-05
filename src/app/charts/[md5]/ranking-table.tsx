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

const INPUT_FILTERS = ['ALL', 'BM', 'KB'] as const;
type InputFilter = (typeof INPUT_FILTERS)[number];

export function RankingTable({ md5 }: { md5: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = Number(searchParams.get('page')) || 1;
  const inputFilter = (searchParams.get('input') ?? 'ALL') as InputFilter;

  const { data, isLoading } = trpc.charts.getRanking.useQuery({
    md5,
    page,
    limit: 100,
    input: inputFilter === 'ALL' ? undefined : inputFilter,
  });

  const totalPages = data ? Math.ceil(data.total / 100) : 0;

  function buildHref(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set('page', String(p));
    if (inputFilter !== 'ALL') params.set('input', inputFilter);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function handleInputFilter(filter: InputFilter) {
    const params = new URLSearchParams();
    if (filter !== 'ALL') params.set('input', filter);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">入力デバイス:</span>
        {INPUT_FILTERS.map((filter) => (
          <Button
            key={filter}
            variant={inputFilter === filter ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleInputFilter(filter)}
          >
            {filter}
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
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>プレイヤー</TableHead>
                  <TableHead>段位</TableHead>
                  <TableHead>クリア</TableHead>
                  <TableHead className="text-right">EXスコア</TableHead>
                  <TableHead className="text-right">コンボ</TableHead>
                  <TableHead className="text-right">PG</TableHead>
                  <TableHead className="text-right">GR</TableHead>
                  <TableHead className="text-right">GD</TableHead>
                  <TableHead className="text-right">BD</TableHead>
                  <TableHead className="text-right">PR</TableHead>
                  <TableHead>OP1</TableHead>
                  <TableHead>OP2</TableHead>
                  <TableHead>入力</TableHead>
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
                    <TableCell className="text-right tabular-nums">{score.pg}</TableCell>
                    <TableCell className="text-right tabular-nums">{score.gr}</TableCell>
                    <TableCell className="text-right tabular-nums">{score.gd}</TableCell>
                    <TableCell className="text-right tabular-nums">{score.bd}</TableCell>
                    <TableCell className="text-right tabular-nums">{score.pr}</TableCell>
                    <TableCell className="text-xs">{score.option1 ?? '-'}</TableCell>
                    <TableCell className="text-xs">{score.option2 ?? '-'}</TableCell>
                    <TableCell className="text-xs">{score.input ?? '-'}</TableCell>
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
