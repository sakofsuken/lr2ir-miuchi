import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq, inArray } from 'drizzle-orm';

import * as schema from '../src/db/schema';

const TARGET_TABLE_ID = 1;

async function main(): Promise<void> {
  const remoteUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!remoteUrl || !authToken) {
    console.error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
    process.exit(1);
  }

  console.log('[seed] Syncing remote DB to local replica...');
  const syncClient = createClient({
    url: 'file:local.db',
    syncUrl: remoteUrl,
    authToken,
  });
  await syncClient.sync();
  const syncDb = drizzle(syncClient, { schema });

  console.log('[seed] Creating seed.db...');
  const seedClient = createClient({ url: 'file:seed.db' });
  const seedDb = drizzle(seedClient, { schema });

  await seedClient.execute(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      dan_sp TEXT,
      dan_dp TEXT,
      play_count INTEGER NOT NULL DEFAULT 0,
      fc_count INTEGER NOT NULL DEFAULT 0
    )
  `);

  await seedClient.execute(`
    CREATE TABLE IF NOT EXISTS charts (
      md5 TEXT PRIMARY KEY,
      bms_id INTEGER,
      title TEXT NOT NULL,
      genre TEXT,
      artist TEXT,
      bpm_min TEXT,
      bpm_max TEXT,
      level TEXT,
      keys TEXT NOT NULL,
      judge_rank TEXT,
      play_count INTEGER NOT NULL DEFAULT 0,
      play_people INTEGER NOT NULL DEFAULT 0,
      clear_count INTEGER NOT NULL DEFAULT 0,
      clear_people INTEGER NOT NULL DEFAULT 0,
      fc_count INTEGER NOT NULL DEFAULT 0,
      hard_count INTEGER NOT NULL DEFAULT 0,
      normal_count INTEGER NOT NULL DEFAULT 0,
      easy_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      body_url TEXT,
      diff_url TEXT,
      comment TEXT,
      tags TEXT,
      suspended INTEGER NOT NULL DEFAULT 0,
      last_updated_by TEXT,
      last_updated_at TEXT
    )
  `);

  await seedClient.execute(`
    CREATE TABLE IF NOT EXISTS scores (
      song_md5 TEXT NOT NULL REFERENCES charts(md5),
      player_id INTEGER NOT NULL REFERENCES players(id),
      clear INTEGER NOT NULL,
      exscore INTEGER NOT NULL,
      score_max INTEGER,
      pg INTEGER NOT NULL DEFAULT 0,
      gr INTEGER NOT NULL DEFAULT 0,
      gd INTEGER NOT NULL DEFAULT 0,
      bd INTEGER NOT NULL DEFAULT 0,
      pr INTEGER NOT NULL DEFAULT 0,
      maxcombo INTEGER NOT NULL DEFAULT 0,
      combo_max INTEGER,
      minbp INTEGER NOT NULL DEFAULT 0,
      option_1 TEXT,
      option_2 TEXT,
      input TEXT,
      client TEXT,
      note TEXT,
      is_cheated INTEGER NOT NULL DEFAULT 0,
      has_ghost INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (song_md5, player_id)
    )
  `);

  await seedClient.execute(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL
    )
  `);

  await seedClient.execute(`
    CREATE TABLE IF NOT EXISTS table_charts (
      table_id INTEGER NOT NULL REFERENCES tables(id),
      chart_md5 TEXT NOT NULL REFERENCES charts(md5),
      level TEXT NOT NULL,
      PRIMARY KEY (table_id, chart_md5)
    )
  `);

  await seedClient.execute(`
    CREATE TABLE IF NOT EXISTS rivals (
      player_id INTEGER NOT NULL REFERENCES players(id),
      rival_id INTEGER NOT NULL REFERENCES players(id),
      PRIMARY KEY (player_id, rival_id)
    )
  `);

  await seedClient.execute(`
    CREATE TABLE IF NOT EXISTS bbs (
      id INTEGER PRIMARY KEY,
      player_id INTEGER REFERENCES players(id),
      player_name TEXT,
      message TEXT NOT NULL,
      posted_at TEXT NOT NULL
    )
  `);

  console.log(`[seed] Extracting data for table ID ${TARGET_TABLE_ID}...`);

  const tableData = await syncDb
    .select()
    .from(schema.tables)
    .where(eq(schema.tables.id, TARGET_TABLE_ID));

  for (const t of tableData) {
    await seedDb.insert(schema.tables).values(t).onConflictDoNothing();
  }

  const chartEntries = await syncDb
    .select()
    .from(schema.tableCharts)
    .where(eq(schema.tableCharts.tableId, TARGET_TABLE_ID));

  for (const entry of chartEntries) {
    await seedDb.insert(schema.tableCharts).values(entry).onConflictDoNothing();
  }

  const md5s = chartEntries.map((e) => e.chartMd5);
  console.log(`[seed] ${md5s.length} charts in table`);

  if (md5s.length > 0) {
    const BATCH_SIZE = 100;
    for (let i = 0; i < md5s.length; i += BATCH_SIZE) {
      const batch = md5s.slice(i, i + BATCH_SIZE);

      const chartData = await syncDb
        .select()
        .from(schema.charts)
        .where(inArray(schema.charts.md5, batch));

      for (const chart of chartData) {
        await seedDb.insert(schema.charts).values(chart).onConflictDoNothing();
      }

      const scoreData = await syncDb
        .select()
        .from(schema.scores)
        .where(inArray(schema.scores.songMd5, batch));

      const playerIds = [...new Set(scoreData.map((s) => s.playerId))];

      if (playerIds.length > 0) {
        for (let j = 0; j < playerIds.length; j += BATCH_SIZE) {
          const playerBatch = playerIds.slice(j, j + BATCH_SIZE);
          const playerData = await syncDb
            .select()
            .from(schema.players)
            .where(inArray(schema.players.id, playerBatch));

          for (const player of playerData) {
            await seedDb.insert(schema.players).values(player).onConflictDoNothing();
          }
        }
      }

      for (const score of scoreData) {
        await seedDb.insert(schema.scores).values(score).onConflictDoNothing();
      }

      console.log(
        `[seed] Processed ${Math.min(i + BATCH_SIZE, md5s.length)}/${md5s.length} charts`,
      );
    }
  }

  syncClient.close();
  seedClient.close();

  console.log('[seed] Done. Created seed.db');
  console.log('To use: cp seed.db local.db');
}

main();
