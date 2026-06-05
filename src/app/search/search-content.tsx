'use client';

import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import Link from 'next/link';
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';

import { PaginationNav } from '@/components/pagination-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

const KEY_MODES = ['', '5KEYS', '7KEYS', '10KEYS', '14KEYS', '9KEYS'] as const;

type SortField = 'title' | 'artist' | 'level' | 'playPeople' | 'clearRate';

function SortIcon({
  field,
  activeSort,
  activeOrder,
}: {
  field: string;
  activeSort: string;
  activeOrder: string;
}) {
  if (activeSort !== field) return <ArrowUpDown className="size-3" />;
  return activeOrder === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
}

export function SearchContent() {
  const [q, setQ] = useQueryState('q', parseAsString.withDefault(''));
  const [keys, setKeys] = useQueryState('keys', parseAsString.withDefault(''));
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('playPeople'));
  const [order, setOrder] = useQueryState('order', parseAsString.withDefault('desc'));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  const { data, isLoading } = trpc.charts.search.useQuery({
    query: q || undefined,
    keys: keys || undefined,
    sort: (sort as SortField) || 'playPeople',
    order: (order as 'asc' | 'desc') || 'desc',
    page,
    limit: 100,
  });

  const totalPages = data ? Math.ceil(data.total / 100) : 0;

  function handleSort(field: SortField) {
    if (sort === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setOrder(field === 'title' || field === 'artist' ? 'asc' : 'desc');
    }
    setPage(1);
  }

  function buildHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (keys) params.set('keys', keys);
    if (sort && sort !== 'playPeople') params.set('sort', sort);
    if (order && order !== 'desc') params.set('order', order);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/search?${qs}` : '/search';
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="タイトル / アーティスト / ジャンルで検索..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                className="flex-1"
              />
              <Button type="button" onClick={() => setPage(1)}>
                <Search className="size-4" />
                検索
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground self-center">キーモード:</span>
              {KEY_MODES.map((mode) => (
                <Button
                  key={mode || 'all'}
                  variant={keys === mode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setKeys(mode);
                    setPage(1);
                  }}
                >
                  {mode || 'ALL'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">{data.total.toLocaleString()} 件</p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => handleSort('title')}
                    >
                      タイトル <SortIcon field="title" activeSort={sort} activeOrder={order} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => handleSort('artist')}
                    >
                      アーティスト <SortIcon field="artist" activeSort={sort} activeOrder={order} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => handleSort('level')}
                    >
                      レベル <SortIcon field="level" activeSort={sort} activeOrder={order} />
                    </button>
                  </TableHead>
                  <TableHead>キーモード</TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => handleSort('playPeople')}
                    >
                      プレイ人数{' '}
                      <SortIcon field="playPeople" activeSort={sort} activeOrder={order} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => handleSort('clearRate')}
                    >
                      クリアレート{' '}
                      <SortIcon field="clearRate" activeSort={sort} activeOrder={order} />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((chart) => {
                  const clearRate =
                    chart.playPeople > 0
                      ? `${((chart.clearPeople / chart.playPeople) * 100).toFixed(1)}%`
                      : '-';
                  return (
                    <TableRow key={chart.md5}>
                      <TableCell>
                        <Link
                          href={`/charts/${chart.md5}`}
                          className="text-primary hover:underline"
                        >
                          {chart.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{chart.artist}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {chart.level ?? '-'}
                      </TableCell>
                      <TableCell>{chart.keys}</TableCell>
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
          <PaginationNav currentPage={page} totalPages={totalPages} buildHref={buildHref} />
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          {q || keys ? '検索結果がありません' : 'キーワードを入力して検索してください'}
        </p>
      )}
    </div>
  );
}
