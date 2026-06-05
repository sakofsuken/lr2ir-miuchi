import { Trophy, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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
import { RivalButton } from './rival-button';
import { ScoreList } from './score-list';

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playerId = Number(id);

  if (Number.isNaN(playerId)) notFound();

  const caller = await createServerCaller();
  const [player, rivals] = await Promise.all([
    caller.players.getById({ id: playerId }),
    caller.rivals.list({ playerId }),
  ]);

  if (!player) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{player.name}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {player.danSp && <span>SP段位: {player.danSp}</span>}
            {player.danDp && <span>DP段位: {player.danDp}</span>}
            <span>プレイ回数: {player.playCount.toLocaleString()}</span>
            <span>FC数: {player.fcCount.toLocaleString()}</span>
          </div>
        </div>
        <RivalButton playerId={playerId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-4" />
            スコア一覧
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreList playerId={playerId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4" />
            ライバル一覧
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rivals.length === 0 ? (
            <p className="text-muted-foreground text-sm">ライバルが登録されていません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>プレイヤー名</TableHead>
                  <TableHead>SP段位</TableHead>
                  <TableHead>DP段位</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rivals.map((rival) => (
                  <TableRow key={rival.rivalId}>
                    <TableCell>
                      <Link
                        href={`/players/${rival.rivalId}`}
                        className="text-primary hover:underline"
                      >
                        {rival.rivalName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {rival.rivalDanSp ?? '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {rival.rivalDanDp ?? '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
