import { db } from '@/db';
import { charts, scores, tableCharts } from '@/db/schema';
import { fetchChartApi } from '@/scraper/lib/api';
import { getProgress, isCompleted, setProgress } from '@/scraper/lib/progress';

const TASK_CHARTS = 'charts:scores';

export async function scrapeCharts(): Promise<void> {
  if (await isCompleted(TASK_CHARTS)) {
    console.log('[charts] Already completed, skipping.');
    return;
  }

  const progress = await getProgress(TASK_CHARTS);
  const lastProcessedIdx = progress?.lastPage ?? 0;

  const md5List = await db.selectDistinct({ md5: tableCharts.chartMd5 }).from(tableCharts);

  const allMd5s = md5List.map((row) => row.md5);
  const remaining = allMd5s.slice(lastProcessedIdx);

  console.log(`[charts] ${remaining.length} charts remaining (${allMd5s.length} total)`);

  let processed = 0;

  for (const md5 of remaining) {
    const chartTaskKey = `charts:${md5}`;
    if (await isCompleted(chartTaskKey)) {
      processed++;
      continue;
    }

    let page = 1;

    while (true) {
      const result = await fetchChartApi(md5, page);

      if (page === 1) {
        await db
          .insert(charts)
          .values(result.chart)
          .onConflictDoUpdate({
            target: charts.md5,
            set: {
              bmsId: result.chart.bmsId,
              title: result.chart.title,
              genre: result.chart.genre,
              artist: result.chart.artist,
              bpmMin: result.chart.bpmMin,
              bpmMax: result.chart.bpmMax,
              level: result.chart.level,
              keys: result.chart.keys,
              judgeRank: result.chart.judgeRank,
              playCount: result.chart.playCount,
              playPeople: result.chart.playPeople,
              clearCount: result.chart.clearCount,
              clearPeople: result.chart.clearPeople,
              fcCount: result.chart.fcCount,
              hardCount: result.chart.hardCount,
              normalCount: result.chart.normalCount,
              easyCount: result.chart.easyCount,
              failedCount: result.chart.failedCount,
              bodyUrl: result.chart.bodyUrl,
              diffUrl: result.chart.diffUrl,
              comment: result.chart.comment,
              tags: result.chart.tags,
              suspended: result.chart.suspended,
              lastUpdatedBy: result.chart.lastUpdatedBy,
              lastUpdatedAt: result.chart.lastUpdatedAt,
            },
          });
      }

      for (const score of result.scores) {
        await db
          .insert(scores)
          .values(score)
          .onConflictDoUpdate({
            target: [scores.songMd5, scores.playerId],
            set: {
              clear: score.clear,
              exscore: score.exscore,
              scoreMax: score.scoreMax,
              pg: score.pg,
              gr: score.gr,
              gd: score.gd,
              bd: score.bd,
              pr: score.pr,
              maxcombo: score.maxcombo,
              comboMax: score.comboMax,
              minbp: score.minbp,
              option1: score.option1,
              option2: score.option2,
              input: score.input,
              client: score.client,
              note: score.note,
              isCheated: score.isCheated,
              hasGhost: score.hasGhost,
            },
          });
      }

      if (!result.hasMorePages) break;
      page++;
    }

    await setProgress(chartTaskKey, page, 'completed');
    processed++;

    const globalIdx = lastProcessedIdx + processed;
    await setProgress(TASK_CHARTS, globalIdx, 'in_progress');

    if (processed % 100 === 0) {
      console.log(`[charts] ${processed}/${remaining.length} charts processed`);
    }
  }

  await setProgress(TASK_CHARTS, allMd5s.length, 'completed');
  console.log(`[charts] Completed. Processed ${processed} charts`);
}

export async function runCharts(): Promise<void> {
  await scrapeCharts();
}
