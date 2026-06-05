import { eq } from 'drizzle-orm';

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

export async function handleGetPlayer(params: Map<string, string>): Promise<Response> {
  const id = parseInt(params.get('id') ?? '0', 10);
  if (!id) {
    return createLR2Response('');
  }

  const playerRows = await db
    .select({ name: players.name })
    .from(players)
    .where(eq(players.id, id))
    .limit(1);

  if (playerRows.length === 0) {
    return createLR2Response('');
  }

  const playerName = playerRows[0].name;

  const scoreRows = await db
    .select({
      songMd5: scores.songMd5,
      clear: scores.clear,
      pg: scores.pg,
      gr: scores.gr,
      gd: scores.gd,
      bd: scores.bd,
      pr: scores.pr,
      maxcombo: scores.maxcombo,
      minbp: scores.minbp,
      option1: scores.option1,
    })
    .from(scores)
    .where(eq(scores.playerId, id));

  let xml = `<rivalname>${escapeXml(playerName)}</rivalname>\n<scorelist>\n`;
  for (const row of scoreRows) {
    const totalnotes = row.pg + row.gr + row.gd + row.bd + row.pr;
    xml += '<score>\n';
    xml += `<hash>${row.songMd5}</hash>\n`;
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
    xml += `<lastupdate>${Math.floor(Date.now() / 1000)}</lastupdate>\n`;
    xml += '</score>\n';
  }
  xml += '</scorelist>';

  return createLR2Response(xml);
}
