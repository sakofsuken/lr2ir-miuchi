import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { ghosts, scores } from '@/db/schema';
import { fetchBinary } from '@/scraper/lib/client';
import { getProgress, isCompleted, setProgress } from '@/scraper/lib/progress';

const TASK_GHOSTS = 'ghosts';

export async function scrapeGhosts(): Promise<void> {
  if (await isCompleted(TASK_GHOSTS)) {
    console.log('[ghosts] Already completed, skipping.');
    return;
  }

  const progress = await getProgress(TASK_GHOSTS);
  const lastProcessedIdx = progress?.lastPage ?? 0;

  const ghostScores = await db
    .select({
      songMd5: scores.songMd5,
      playerId: scores.playerId,
    })
    .from(scores)
    .where(eq(scores.hasGhost, 1));

  const remaining = ghostScores.slice(lastProcessedIdx);
  console.log(`[ghosts] ${remaining.length} ghosts remaining (${ghostScores.length} total)`);

  let processed = 0;
  let errors = 0;

  for (const score of remaining) {
    try {
      const existing = await db
        .select({ songMd5: ghosts.songMd5 })
        .from(ghosts)
        .where(and(eq(ghosts.songMd5, score.songMd5), eq(ghosts.playerId, score.playerId)))
        .limit(1);

      if (existing.length > 0) {
        processed++;
        continue;
      }

      const data = await fetchBinary(`/ghosts/${score.songMd5}/${score.playerId}`);

      await db
        .insert(ghosts)
        .values({
          songMd5: score.songMd5,
          playerId: score.playerId,
          data,
        })
        .onConflictDoNothing();

      processed++;
    } catch (error) {
      errors++;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[ghosts] Failed ${score.songMd5}/${score.playerId}: ${message}`);
      processed++;
    }

    const globalIdx = lastProcessedIdx + processed;
    if (processed % 100 === 0) {
      await setProgress(TASK_GHOSTS, globalIdx, 'in_progress');
      console.log(`[ghosts] ${processed}/${remaining.length} processed (${errors} errors)`);
    }
  }

  await setProgress(TASK_GHOSTS, ghostScores.length, 'completed');
  console.log(`[ghosts] Completed. Processed ${processed}, errors: ${errors}`);
}

export async function runGhosts(): Promise<void> {
  await scrapeGhosts();
}
