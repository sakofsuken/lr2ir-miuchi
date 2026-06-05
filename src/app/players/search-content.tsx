'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';

import { PaginationNav } from '@/components/pagination-nav';
import { Button } from '@/components/ui/button';
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

export function PlayerSearchContent() {
  const [q, setQ] = useQueryState('q', parseAsString.withDefault(''));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  const { data, isLoading } = trpc.players.search.useQuery(
    { query: q, page, limit: 50 },
    { enabled: q.length > 0 },
  );

  const totalPages = data ? Math.ceil(data.total / 50) : 0;

  function buildHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/players?${qs}` : '/players';
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="プレイヤー名で検索..."
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
                  <TableHead>プレイヤー名</TableHead>
                  <TableHead>SP段位</TableHead>
                  <TableHead>DP段位</TableHead>
                  <TableHead className="text-right">プレイ回数</TableHead>
                  <TableHead className="text-right">FC数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <Link href={`/players/${player.id}`} className="text-primary hover:underline">
                        {player.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{player.danSp ?? '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{player.danDp ?? '-'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {player.playCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {player.fcCount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationNav currentPage={page} totalPages={totalPages} buildHref={buildHref} />
        </>
      ) : q ? (
        <p className="text-muted-foreground text-sm">検索結果がありません</p>
      ) : (
        <p className="text-muted-foreground text-sm">プレイヤー名を入力して検索してください</p>
      )}
    </div>
  );
}
