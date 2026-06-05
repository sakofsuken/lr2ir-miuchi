import { createHash } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { charts, ghosts, players, scores } from '@/db/schema';
import { createLR2Response } from './encoding';

function md5(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

export async function handleScore(params: Map<string, string>): Promise<Response> {
  const id = parseInt(params.get('id') ?? '0', 10);
  const passmd5 = params.get('passmd5') ?? '';
  const songmd5 = params.get('songmd5') ?? '';

  if (!id || !passmd5 || !songmd5) {
    return createLR2Response('ERROR');
  }

  const playerRows = await db
    .select({ passMd5: players.passMd5 })
    .from(players)
    .where(eq(players.id, id))
    .limit(1);

  if (playerRows.length === 0 || playerRows[0].passMd5 !== passmd5) {
    return createLR2Response('ERROR');
  }

  const exscore = parseInt(params.get('exscore') ?? '0', 10);
  const clear = parseInt(params.get('clear') ?? '0', 10);
  const scorehash = params.get('scorehash') ?? '';
  const expectedHash = md5(passmd5 + songmd5 + exscore.toString() + clear.toString());

  if (scorehash !== expectedHash) {
    return createLR2Response('ERROR');
  }

  const pg = parseInt(params.get('pg') ?? '0', 10);
  const gr = parseInt(params.get('gr') ?? '0', 10);
  const gd = parseInt(params.get('gd') ?? '0', 10);
  const bd = parseInt(params.get('bd') ?? '0', 10);
  const pr = parseInt(params.get('pr') ?? '0', 10);
  const maxcombo = parseInt(params.get('maxcombo') ?? '0', 10);
  const minbp = parseInt(params.get('minbp') ?? '0', 10);
  const playcount = parseInt(params.get('playcount') ?? '0', 10);
  const totalnotes = parseInt(params.get('totalnotes') ?? '0', 10);
  const optHistory = parseInt(params.get('opt_history') ?? '0', 10);
  const optThis = parseInt(params.get('opt_this') ?? '0', 10);
  const line = parseInt(params.get('line') ?? '7', 10);
  const ghost = params.get('ghost') ?? '';

  if (totalnotes > 0 && exscore > totalnotes * 2) {
    return createLR2Response('ERROR');
  }

  const title = params.get('title') ?? '';
  const genre = params.get('genre') ?? '';
  const artist = params.get('artist') ?? '';
  const maxbpm = params.get('maxbpm') ?? '';
  const minbpm = params.get('minbpm') ?? '';
  const playlevel = params.get('playlevel') ?? '';
  const judge = params.get('judge') ?? '';

  await db
    .insert(charts)
    .values({
      md5: songmd5,
      title: title || 'Unknown',
      genre: genre || null,
      artist: artist || null,
      bpmMin: minbpm || null,
      bpmMax: maxbpm || null,
      level: playlevel || null,
      keys: line.toString(),
      judgeRank: judge || null,
    })
    .onConflictDoNothing();

  const existingScores = await db
    .select({ exscore: scores.exscore, clear: scores.clear })
    .from(scores)
    .where(and(eq(scores.songMd5, songmd5), eq(scores.playerId, id)))
    .limit(1);

  const isNewBest =
    existingScores.length === 0 ||
    exscore > existingScores[0].exscore ||
    (exscore === existingScores[0].exscore && clear > existingScores[0].clear);

  if (isNewBest) {
    await db
      .insert(scores)
      .values({
        songMd5: songmd5,
        playerId: id,
        clear,
        exscore,
        pg,
        gr,
        gd,
        bd,
        pr,
        maxcombo,
        minbp,
        option1: optThis.toString(),
        option2: optHistory.toString(),
        client: 'LR2',
        hasGhost: ghost ? 1 : 0,
      })
      .onConflictDoUpdate({
        target: [scores.songMd5, scores.playerId],
        set: {
          clear,
          exscore,
          pg,
          gr,
          gd,
          bd,
          pr,
          maxcombo,
          minbp,
          option1: optThis.toString(),
          option2: optHistory.toString(),
          hasGhost: ghost ? 1 : 0,
        },
      });

    if (ghost) {
      const ghostBuffer = Buffer.from(ghost, 'utf-8');
      await db
        .insert(ghosts)
        .values({ songMd5: songmd5, playerId: id, data: ghostBuffer })
        .onConflictDoUpdate({
          target: [ghosts.songMd5, ghosts.playerId],
          set: { data: ghostBuffer },
        });
    }
  }

  await db
    .update(charts)
    .set({
      playCount: sql`${charts.playCount} + 1`,
    })
    .where(eq(charts.md5, songmd5));

  if (playcount <= 1) {
    await db
      .update(charts)
      .set({
        playPeople: sql`${charts.playPeople} + 1`,
      })
      .where(eq(charts.md5, songmd5));
  }

  await db
    .update(players)
    .set({
      playCount: sql`${players.playCount} + 1`,
    })
    .where(eq(players.id, id));

  return createLR2Response('OK');
}
