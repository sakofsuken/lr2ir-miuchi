import { db } from '@/db';
import { players, rivals } from '@/db/schema';
import { fetchPage } from '@/scraper/lib/client';
import { parsePlayerList, parsePlayerRivals, parsePagination } from '@/scraper/lib/parser';
import { getProgress, isCompleted, setProgress } from '@/scraper/lib/progress';

const TASK_LIST = 'players:list';
const TASK_RIVALS = 'players:rivals';

export async function scrapePlayerList(): Promise<void> {
  if (await isCompleted(TASK_LIST)) {
    console.log('[players:list] Already completed, skipping.');
    return;
  }

  const progress = await getProgress(TASK_LIST);
  const startPage = (progress?.lastPage ?? 0) + 1;
  let totalPages = Infinity;
  let totalInserted = 0;

  console.log(`[players:list] Starting from page ${startPage}`);

  for (let page = startPage; page <= totalPages; page++) {
    const html = await fetchPage(`/players?page=${page}`);
    const { totalPages: tp } = parsePagination(html);
    totalPages = tp;

    const items = parsePlayerList(html);
    if (items.length === 0) break;

    for (const item of items) {
      await db
        .insert(players)
        .values({
          id: item.id,
          name: item.name,
          danSp: item.danSp,
          danDp: item.danDp,
          playCount: item.playCount,
          fcCount: item.fcCount,
        })
        .onConflictDoUpdate({
          target: players.id,
          set: {
            name: item.name,
            danSp: item.danSp,
            danDp: item.danDp,
            playCount: item.playCount,
            fcCount: item.fcCount,
          },
        });
    }

    totalInserted += items.length;
    await setProgress(TASK_LIST, page, 'in_progress');

    if (totalInserted % 500 === 0 || page % 100 === 0) {
      console.log(`[players:list] Page ${page}/${totalPages} — ${totalInserted} players processed`);
    }
  }

  await setProgress(TASK_LIST, totalPages, 'completed');
  console.log(`[players:list] Completed. Total: ${totalInserted} players`);
}

export async function scrapePlayerRivals(): Promise<void> {
  if (await isCompleted(TASK_RIVALS)) {
    console.log('[players:rivals] Already completed, skipping.');
    return;
  }

  const progress = await getProgress(TASK_RIVALS);
  const lastProcessedId = progress?.lastPage ?? 0;

  const allPlayers = await db.select({ id: players.id }).from(players).orderBy(players.id);

  const remaining = allPlayers.filter((p) => p.id > lastProcessedId);
  console.log(
    `[players:rivals] ${remaining.length} players remaining (starting after ID ${lastProcessedId})`,
  );

  let processed = 0;

  for (const player of remaining) {
    const html = await fetchPage(`/players/${player.id}`);
    const rivalList = parsePlayerRivals(html, player.id);

    for (const rival of rivalList) {
      await db.insert(rivals).values(rival).onConflictDoNothing();
    }

    processed++;
    await setProgress(TASK_RIVALS, player.id, 'in_progress');

    if (processed % 100 === 0) {
      console.log(`[players:rivals] ${processed}/${remaining.length} players processed`);
    }
  }

  await setProgress(TASK_RIVALS, remaining[remaining.length - 1]?.id ?? 0, 'completed');
  console.log(`[players:rivals] Completed. Processed ${processed} players`);
}

export async function runPlayers(): Promise<void> {
  await scrapePlayerList();
  await scrapePlayerRivals();
}
