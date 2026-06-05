import { db } from '@/db';
import { tableCharts } from '@/db/schema';
import { createLR2Response } from './encoding';

export async function handleGetInsaneList(): Promise<Response> {
  const rows = await db
    .select({
      chartMd5: tableCharts.chartMd5,
      level: tableCharts.level,
    })
    .from(tableCharts);

  let xml = '<list>\n';
  for (const row of rows) {
    xml += '<song>\n';
    xml += `<hash>${row.chartMd5}</hash>\n`;
    xml += `<exlevel>${row.level}</exlevel>\n`;
    xml += '</song>\n';
  }
  xml += '</list>';

  return createLR2Response(xml);
}
