import { db } from '@/db';
import { tables, tableCharts } from '@/db/schema';
import { fetchPage } from '@/scraper/lib/client';
import {
  parseTableList,
  parseTableLevels,
  parseTableCharts,
  parsePagination,
} from '@/scraper/lib/parser';
import { isCompleted, setProgress } from '@/scraper/lib/progress';

const TASK_TABLES = 'tables:list';

export async function scrapeTables(): Promise<void> {
  if (await isCompleted(TASK_TABLES)) {
    console.log('[tables] Already completed, skipping.');
    return;
  }

  console.log('[tables] Fetching table list...');
  const html = await fetchPage('/tables');
  const tableList = parseTableList(html);

  for (const table of tableList) {
    await db
      .insert(tables)
      .values({ id: table.id, name: table.name, symbol: table.symbol })
      .onConflictDoUpdate({
        target: tables.id,
        set: { name: table.name, symbol: table.symbol },
      });
  }

  console.log(`[tables] ${tableList.length} tables saved. Fetching levels...`);

  let totalCharts = 0;

  for (const table of tableList) {
    const taskKey = `tables:${table.id}`;
    if (await isCompleted(taskKey)) {
      console.log(`[tables] Table ${table.id} (${table.name}) already completed, skipping.`);
      continue;
    }

    const tableHtml = await fetchPage(`/tables/${table.id}`);
    const levels = parseTableLevels(tableHtml);

    for (const lvl of levels) {
      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const suffix = page > 1 ? `?page=${page}` : '';
        const levelHtml = await fetchPage(`${lvl.href}${suffix}`);
        const { totalPages: tp } = parsePagination(levelHtml);
        totalPages = tp;

        const charts = parseTableCharts(levelHtml, lvl.level);

        for (const chart of charts) {
          await db
            .insert(tableCharts)
            .values({
              tableId: table.id,
              chartMd5: chart.md5,
              level: chart.level,
            })
            .onConflictDoNothing();
        }

        totalCharts += charts.length;
        page++;
      }
    }

    await setProgress(taskKey, 0, 'completed');
    console.log(`[tables] Table ${table.id} (${table.name}) completed`);
  }

  await setProgress(TASK_TABLES, 0, 'completed');
  console.log(`[tables] All tables completed. Total chart entries: ${totalCharts}`);
}

export async function runTables(): Promise<void> {
  await scrapeTables();
}
