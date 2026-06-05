import { and, desc, eq, gt, ne } from 'drizzle-orm';

import { db } from '@/db';
import { ghosts, players, scores } from '@/db/schema';
import { createLR2Response, encodeShiftJIS } from './encoding';

export async function handleGetGhost(params: Map<string, string>): Promise<Response> {
  const songmd5 = params.get('songmd5') ?? '';
  const mode = params.get('mode') ?? 'top';
  const playerid = parseInt(params.get('playerid') ?? '0', 10);

  if (!songmd5) {
    return createLR2Response('NOPLAYER,0,0,');
  }

  if (mode === 'top') {
    return getTopGhost(songmd5);
  }

  if (mode === 'next') {
    return getNextGhost(songmd5, playerid);
  }

  if (mode === 'average') {
    return getAverageScore(songmd5);
  }

  return createLR2Response('NOPLAYER,0,0,');
}

async function getTopGhost(songmd5: string): Promise<Response> {
  const rows = await db
    .select({
      playerId: scores.playerId,
      exscore: scores.exscore,
      playerName: players.name,
    })
    .from(scores)
    .innerJoin(players, eq(scores.playerId, players.id))
    .where(eq(scores.songMd5, songmd5))
    .orderBy(desc(scores.exscore))
    .limit(1);

  if (rows.length === 0) {
    return createLR2Response('NOPLAYER,0,0,');
  }

  const topScore = rows[0];
  return getGhostResponse(songmd5, topScore.playerId, topScore.playerName, topScore.exscore);
}

async function getNextGhost(songmd5: string, playerid: number): Promise<Response> {
  const myScoreRows = await db
    .select({ exscore: scores.exscore })
    .from(scores)
    .where(and(eq(scores.songMd5, songmd5), eq(scores.playerId, playerid)))
    .limit(1);

  const myExscore = myScoreRows.length > 0 ? myScoreRows[0].exscore : 0;

  const rows = await db
    .select({
      playerId: scores.playerId,
      exscore: scores.exscore,
      playerName: players.name,
    })
    .from(scores)
    .innerJoin(players, eq(scores.playerId, players.id))
    .where(
      and(
        eq(scores.songMd5, songmd5),
        gt(scores.exscore, myExscore),
        ne(scores.playerId, playerid),
      ),
    )
    .orderBy(scores.exscore)
    .limit(1);

  if (rows.length === 0) {
    return createLR2Response('NOPLAYER,0,0,');
  }

  const nextScore = rows[0];
  return getGhostResponse(songmd5, nextScore.playerId, nextScore.playerName, nextScore.exscore);
}

async function getAverageScore(songmd5: string): Promise<Response> {
  const rows = await db
    .select({ exscore: scores.exscore })
    .from(scores)
    .where(eq(scores.songMd5, songmd5));

  if (rows.length === 0) {
    return createLR2Response('NOPLAYER,0,0,');
  }

  const avgExscore = Math.round(rows.reduce((sum, r) => sum + r.exscore, 0) / rows.length);
  return createLR2Response(`AVERAGE,${avgExscore},0,`);
}

async function getGhostResponse(
  songmd5: string,
  playerId: number,
  playerName: string,
  exscore: number,
): Promise<Response> {
  const ghostRows = await db
    .select({ data: ghosts.data })
    .from(ghosts)
    .where(and(eq(ghosts.songMd5, songmd5), eq(ghosts.playerId, playerId)))
    .limit(1);

  const ghostData = ghostRows.length > 0 ? Buffer.from(ghostRows[0].data).toString('utf-8') : '';
  const csv = `${playerName},${exscore},0,${ghostData}`;
  const body = encodeShiftJIS(`#${csv}`);
  const bytes = new Uint8Array(body);

  return new Response(bytes, {
    headers: {
      'Content-Type': 'text/plain; charset=shift_jis',
      'Content-Length': bytes.length.toString(),
    },
  });
}
