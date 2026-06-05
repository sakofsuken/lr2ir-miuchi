import { blob, index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const players = sqliteTable('players', {
  id: integer().primaryKey(),
  name: text().notNull(),
  danSp: text('dan_sp'),
  danDp: text('dan_dp'),
  playCount: integer('play_count').notNull().default(0),
  fcCount: integer('fc_count').notNull().default(0),
  passwordHash: text('password_hash'),
  passMd5: text('pass_md5'),
});

export const sessions = sqliteTable('sessions', {
  id: text().primaryKey(),
  playerId: integer('player_id')
    .notNull()
    .references(() => players.id),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

export const charts = sqliteTable('charts', {
  md5: text().primaryKey(),
  bmsId: integer('bms_id'),
  title: text().notNull(),
  genre: text(),
  artist: text(),
  bpmMin: text('bpm_min'),
  bpmMax: text('bpm_max'),
  level: text(),
  keys: text().notNull(),
  judgeRank: text('judge_rank'),
  playCount: integer('play_count').notNull().default(0),
  playPeople: integer('play_people').notNull().default(0),
  clearCount: integer('clear_count').notNull().default(0),
  clearPeople: integer('clear_people').notNull().default(0),
  fcCount: integer('fc_count').notNull().default(0),
  hardCount: integer('hard_count').notNull().default(0),
  normalCount: integer('normal_count').notNull().default(0),
  easyCount: integer('easy_count').notNull().default(0),
  failedCount: integer('failed_count').notNull().default(0),
  bodyUrl: text('body_url'),
  diffUrl: text('diff_url'),
  comment: text(),
  tags: text(),
  suspended: integer().notNull().default(0),
  lastUpdatedBy: text('last_updated_by'),
  lastUpdatedAt: text('last_updated_at'),
});

export const scores = sqliteTable(
  'scores',
  {
    songMd5: text('song_md5')
      .notNull()
      .references(() => charts.md5),
    playerId: integer('player_id')
      .notNull()
      .references(() => players.id),
    clear: integer().notNull(),
    exscore: integer().notNull(),
    scoreMax: integer('score_max'),
    pg: integer().notNull().default(0),
    gr: integer().notNull().default(0),
    gd: integer().notNull().default(0),
    bd: integer().notNull().default(0),
    pr: integer().notNull().default(0),
    maxcombo: integer().notNull().default(0),
    comboMax: integer('combo_max'),
    minbp: integer().notNull().default(0),
    option1: text('option_1'),
    option2: text('option_2'),
    input: text(),
    client: text(),
    note: text(),
    isCheated: integer('is_cheated').notNull().default(0),
    hasGhost: integer('has_ghost').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.songMd5, table.playerId] }),
    index('scores_ranking_idx').on(table.songMd5, table.exscore),
  ],
);

export const ghosts = sqliteTable(
  'ghosts',
  {
    songMd5: text('song_md5').notNull(),
    playerId: integer('player_id').notNull(),
    data: blob({ mode: 'buffer' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.songMd5, table.playerId] })],
);

export const courses = sqliteTable('courses', {
  id: integer().primaryKey(),
  title: text().notNull(),
  category: text(),
  keys: text().notNull(),
  creatorId: integer('creator_id').references(() => players.id),
  stages: text().notNull(),
  playCount: integer('play_count').notNull().default(0),
  playPeople: integer('play_people').notNull().default(0),
  clearCount: integer('clear_count').notNull().default(0),
  clearPeople: integer('clear_people').notNull().default(0),
});

export const courseScores = sqliteTable(
  'course_scores',
  {
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id),
    playerId: integer('player_id')
      .notNull()
      .references(() => players.id),
    clear: integer().notNull(),
    exscore: integer().notNull(),
    scoreMax: integer('score_max'),
    pg: integer().notNull().default(0),
    gr: integer().notNull().default(0),
    gd: integer().notNull().default(0),
    bd: integer().notNull().default(0),
    pr: integer().notNull().default(0),
    maxcombo: integer().notNull().default(0),
    minbp: integer().notNull().default(0),
    option1: text('option_1'),
    option2: text('option_2'),
    input: text(),
    client: text(),
    isCheated: integer('is_cheated').notNull().default(0),
    hasGhost: integer('has_ghost').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.courseId, table.playerId] }),
    index('course_scores_ranking_idx').on(table.courseId, table.exscore),
  ],
);

export const rivals = sqliteTable(
  'rivals',
  {
    playerId: integer('player_id')
      .notNull()
      .references(() => players.id),
    rivalId: integer('rival_id')
      .notNull()
      .references(() => players.id),
  },
  (table) => [
    primaryKey({ columns: [table.playerId, table.rivalId] }),
    index('rivals_reverse_idx').on(table.rivalId),
  ],
);

export const tables = sqliteTable('tables', {
  id: integer().primaryKey(),
  name: text().notNull(),
  symbol: text().notNull(),
});

export const tableCharts = sqliteTable(
  'table_charts',
  {
    tableId: integer('table_id')
      .notNull()
      .references(() => tables.id),
    chartMd5: text('chart_md5')
      .notNull()
      .references(() => charts.md5),
    level: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.tableId, table.chartMd5] })],
);

export const bbs = sqliteTable('bbs', {
  id: integer().primaryKey(),
  playerId: integer('player_id').references(() => players.id),
  playerName: text('player_name'),
  message: text().notNull(),
  postedAt: text('posted_at').notNull(),
});

export const scrapeProgress = sqliteTable('scrape_progress', {
  task: text().primaryKey(),
  lastPage: integer('last_page').notNull().default(0),
  status: text().notNull().default('in_progress'),
  updatedAt: text('updated_at').notNull(),
});
