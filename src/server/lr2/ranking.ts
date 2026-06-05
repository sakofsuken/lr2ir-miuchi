import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { players, scores } from '@/db/schema';
import { createLR2Response } from './encoding';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function handleGetRanking(params: Map<string, string>): Promise<Response> {
  const songmd5 = params.get('songmd5') ?? '';
  if (!songmd5) {
    return createLR2Response('');
  }

  const rows = await db
    .select({
      playerId: scores.playerId,
      playerName: players.name,
      danSp: players.danSp,
      danDp: players.danDp,
      clear: scores.clear,
      pg: scores.pg,
      gr: scores.gr,
      gd: scores.gd,
      bd: scores.bd,
      pr: scores.pr,
      maxcombo: scores.maxcombo,
      minbp: scores.minbp,
      option1: scores.option1,
      playCount: players.playCount,
    })
    .from(scores)
    .innerJoin(players, eq(scores.playerId, players.id))
    .where(eq(scores.songMd5, songmd5))
    .orderBy(desc(scores.exscore))
    .limit(100);

  const now = Math.floor(Date.now() / 1000).toString();

  let xml = `<lastupdate>${now}</lastupdate>\n<ranking>\n`;
  for (const row of rows) {
    const totalnotes = row.pg + row.gr + row.gd + row.bd + row.pr;
    const sp = row.danSp ?? '';
    const dp = row.danDp ?? '';
    xml += '<score>\n';
    xml += `<name>${escapeXml(row.playerName)}</name>\n`;
    xml += `<id>${row.playerId}</id>\n`;
    xml += `<sp>${escapeXml(sp)}</sp>\n`;
    xml += `<dp>${escapeXml(dp)}</dp>\n`;
    xml += `<clear>${row.clear}</clear>\n`;
    xml += `<notes>${totalnotes}</notes>\n`;
    xml += `<combo>${row.maxcombo}</combo>\n`;
    xml += `<pg>${row.pg}</pg>\n`;
    xml += `<gr>${row.gr}</gr>\n`;
    xml += `<gd>${row.gd}</gd>\n`;
    xml += `<bd>${row.bd}</bd>\n`;
    xml += `<pr>${row.pr}</pr>\n`;
    xml += `<minbp>${row.minbp}</minbp>\n`;
    xml += `<option>${row.option1 ?? '0'}</option>\n`;
    xml += '<comment></comment>\n';
    xml += `<playcount>${row.playCount}</playcount>\n`;
    xml += '</score>\n';
  }
  xml += '</ranking>';

  return createLR2Response(xml);
}
