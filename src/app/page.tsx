import { BarChart3, Music, Trophy, Users } from 'lucide-react';
import Link from 'next/link';

import { SearchBox } from '@/components/search-box';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createServerCaller } from '@/lib/trpc-server';

export default async function HomePage() {
  const caller = await createServerCaller();

  const [stats, popularCharts, bbsPosts] = await Promise.all([
    caller.players.getStats(),
    caller.charts.getPopular({ limit: 10 }),
    caller.bbs.list({ page: 1, limit: 10 }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">LR2IR</h1>
        <p className="text-muted-foreground mt-1">LR2 Internet Ranking Archive</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          icon={<Music className="size-4 text-muted-foreground" />}
          label="登録 BMS 数"
          value={stats.chartCount}
        />
        <StatsCard
          icon={<Users className="size-4 text-muted-foreground" />}
          label="登録プレイヤー数"
          value={stats.playerCount}
        />
        <StatsCard
          icon={<Trophy className="size-4 text-muted-foreground" />}
          label="登録スコア数"
          value={stats.scoreCount}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>検索</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchBox />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-4" />
            人気ランキング
          </CardTitle>
        </CardHeader>
        <CardContent>
          {popularCharts.length === 0 ? (
            <p className="text-muted-foreground text-sm">データがありません</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>タイトル</TableHead>
                    <TableHead>アーティスト</TableHead>
                    <TableHead className="text-right">プレイ人数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popularCharts.map((chart, index) => (
                    <TableRow key={chart.md5}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <Link
                          href={`/charts/${chart.md5}`}
                          className="text-primary hover:underline"
                        >
                          {chart.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{chart.artist}</TableCell>
                      <TableCell className="text-right">
                        {chart.playPeople.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>BBS 最新投稿</CardTitle>
        </CardHeader>
        <CardContent>
          {bbsPosts.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">投稿がありません</p>
          ) : (
            <div className="space-y-4">
              {bbsPosts.items.map((post) => (
                <div key={post.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2 text-sm">
                    {post.playerId ? (
                      <Link
                        href={`/players/${post.playerId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {post.playerName}
                      </Link>
                    ) : (
                      <span className="font-medium">{post.playerName ?? '匿名'}</span>
                    )}
                    <span className="text-muted-foreground text-xs">
                      {new Date(post.postedAt).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap break-words">{post.message}</p>
                </div>
              ))}
              <div className="pt-2">
                <Link href="/bbs" className="text-sm text-primary hover:underline">
                  もっと見る →
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
