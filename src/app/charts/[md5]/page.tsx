import { ExternalLink } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
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
import { RankingTable } from './ranking-table';

export default async function ChartPage({ params }: { params: Promise<{ md5: string }> }) {
  const { md5 } = await params;
  const caller = await createServerCaller();
  const chart = await caller.charts.getByMd5({ md5 });

  if (!chart) notFound();

  const bpm =
    chart.bpmMin && chart.bpmMax
      ? chart.bpmMin === chart.bpmMax
        ? chart.bpmMin
        : `${chart.bpmMin}-${chart.bpmMax}`
      : '-';

  const clearRate =
    chart.playPeople > 0 ? `${((chart.clearPeople / chart.playPeople) * 100).toFixed(1)}%` : '-';

  const clearStats = [
    { label: 'FullCombo', count: chart.fcCount, color: 'text-yellow-400' },
    { label: 'Hard', count: chart.hardCount, color: 'text-orange-400' },
    { label: 'Normal', count: chart.normalCount, color: 'text-blue-400' },
    { label: 'Easy', count: chart.easyCount, color: 'text-green-400' },
    { label: 'Failed', count: chart.failedCount, color: 'text-red-400' },
  ];

  const totalClears = chart.fcCount + chart.hardCount + chart.normalCount + chart.easyCount;

  const tags = chart.tags ? chart.tags.split(',').filter(Boolean) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{chart.title}</h1>
        {chart.artist && <p className="text-muted-foreground mt-1">{chart.artist}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>譜面情報</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {chart.genre && (
                <>
                  <dt className="text-muted-foreground">ジャンル</dt>
                  <dd>{chart.genre}</dd>
                </>
              )}
              <dt className="text-muted-foreground">BPM</dt>
              <dd>{bpm}</dd>
              <dt className="text-muted-foreground">レベル</dt>
              <dd>{chart.level ?? '-'}</dd>
              <dt className="text-muted-foreground">キーモード</dt>
              <dd>{chart.keys}</dd>
              {chart.judgeRank && (
                <>
                  <dt className="text-muted-foreground">判定ランク</dt>
                  <dd>{chart.judgeRank}</dd>
                </>
              )}
            </dl>
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            )}
            {(chart.bodyUrl || chart.diffUrl) && (
              <div className="mt-3 flex gap-3 text-sm">
                {chart.bodyUrl && (
                  <a
                    href={chart.bodyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    本体URL
                  </a>
                )}
                {chart.diffUrl && (
                  <a
                    href={chart.diffUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    差分URL
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>クリア統計</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">プレイ回数</dt>
              <dd>{chart.playCount.toLocaleString()}</dd>
              <dt className="text-muted-foreground">プレイ人数</dt>
              <dd>{chart.playPeople.toLocaleString()}</dd>
              <dt className="text-muted-foreground">クリア人数</dt>
              <dd>{chart.clearPeople.toLocaleString()}</dd>
              <dt className="text-muted-foreground">クリアレート</dt>
              <dd>{clearRate}</dd>
            </dl>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>種別</TableHead>
                  <TableHead className="text-right">人数</TableHead>
                  <TableHead className="text-right">割合</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clearStats.map((stat) => (
                  <TableRow key={stat.label}>
                    <TableCell className={stat.color}>{stat.label}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {stat.count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {chart.playPeople > 0
                        ? `${((stat.count / chart.playPeople) * 100).toFixed(1)}%`
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {chart.playPeople > 0 && (
              <div className="flex h-4 w-full overflow-hidden rounded-full">
                {clearStats.map((stat) => {
                  const pct = (stat.count / (totalClears + chart.failedCount)) * 100;
                  if (pct === 0) return null;
                  const bgMap: Record<string, string> = {
                    FullCombo: 'bg-yellow-400',
                    Hard: 'bg-orange-400',
                    Normal: 'bg-blue-400',
                    Easy: 'bg-green-400',
                    Failed: 'bg-red-400',
                  };
                  return (
                    <div
                      key={stat.label}
                      className={bgMap[stat.label]}
                      style={{ width: `${pct}%` }}
                      title={`${stat.label}: ${pct.toFixed(1)}%`}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>スコアランキング</CardTitle>
        </CardHeader>
        <CardContent>
          <RankingTable md5={md5} />
        </CardContent>
      </Card>
    </div>
  );
}
