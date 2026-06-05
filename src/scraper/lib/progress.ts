import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { scrapeProgress } from '@/db/schema';

export async function getProgress(
  task: string,
): Promise<{ lastPage: number; status: string } | null> {
  const rows = await db.select().from(scrapeProgress).where(eq(scrapeProgress.task, task)).limit(1);
  if (rows.length === 0) return null;
  return { lastPage: rows[0].lastPage, status: rows[0].status };
}

export async function setProgress(task: string, lastPage: number, status: string): Promise<void> {
  await db
    .insert(scrapeProgress)
    .values({
      task,
      lastPage,
      status,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: scrapeProgress.task,
      set: {
        lastPage,
        status,
        updatedAt: new Date().toISOString(),
      },
    });
}

export async function isCompleted(task: string): Promise<boolean> {
  const progress = await getProgress(task);
  return progress?.status === 'completed';
}
