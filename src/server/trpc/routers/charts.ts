import { type SQL, and, asc, count, desc, eq, gte, like, lte, or, sql } from 'drizzle-orm';
import { z } from 'zod/v4';

import { charts, players, scores } from '@/db/schema';
import { createRouter } from '../init';
import { publicProcedure } from '../procedures';

export const chartsRouter = createRouter({
  getPopular: publicProcedure
    .input(z.object({ limit: z.number().int().positive().max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          md5: charts.md5,
          title: charts.title,
          artist: charts.artist,
          playPeople: charts.playPeople,
        })
        .from(charts)
        .orderBy(desc(charts.playPeople))
        .limit(input.limit);

      return rows;
    }),

  getByMd5: publicProcedure.input(z.object({ md5: z.string() })).query(async ({ ctx, input }) => {
    const rows = await ctx.db.select().from(charts).where(eq(charts.md5, input.md5)).limit(1);

    return rows[0] ?? null;
  }),

  getRanking: publicProcedure
    .input(
      z.object({
        md5: z.string(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(50),
        input: z.enum(['BM', 'KB']).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(scores.songMd5, input.md5)];
      if (input.input) {
        conditions.push(eq(scores.input, input.input));
      }
      const where = and(...conditions);

      const [totalRows, rows] = await Promise.all([
        ctx.db.select({ count: count() }).from(scores).where(where),
        ctx.db
          .select({
            songMd5: scores.songMd5,
            playerId: scores.playerId,
            clear: scores.clear,
            exscore: scores.exscore,
            scoreMax: scores.scoreMax,
            pg: scores.pg,
            gr: scores.gr,
            gd: scores.gd,
            bd: scores.bd,
            pr: scores.pr,
            maxcombo: scores.maxcombo,
            comboMax: scores.comboMax,
            minbp: scores.minbp,
            option1: scores.option1,
            option2: scores.option2,
            input: scores.input,
            client: scores.client,
            note: scores.note,
            playerName: players.name,
            playerDanSp: players.danSp,
            playerDanDp: players.danDp,
          })
          .from(scores)
          .innerJoin(players, eq(scores.playerId, players.id))
          .where(where)
          .orderBy(desc(scores.exscore))
          .offset((input.page - 1) * input.limit)
          .limit(input.limit),
      ]);

      return {
        items: rows,
        total: totalRows[0]?.count ?? 0,
      };
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        keys: z.string().optional(),
        sort: z
          .enum(['title', 'artist', 'level', 'playPeople', 'clearRate'])
          .optional()
          .default('playPeople'),
        order: z.enum(['asc', 'desc']).optional().default('desc'),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(100),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions: SQL[] = [];

      if (input.query) {
        const pattern = `%${input.query}%`;
        const textMatch = or(
          like(charts.title, pattern),
          like(charts.artist, pattern),
          like(charts.genre, pattern),
        );
        if (textMatch) conditions.push(textMatch);
      }

      if (input.keys) {
        conditions.push(eq(charts.keys, input.keys));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sortColumnMap = {
        title: charts.title,
        artist: charts.artist,
        level: sql`CAST(${charts.level} AS INTEGER)`,
        playPeople: charts.playPeople,
        clearRate: sql`CASE WHEN ${charts.playPeople} > 0 THEN CAST(${charts.clearPeople} AS REAL) / ${charts.playPeople} ELSE 0 END`,
      };

      const sortCol = sortColumnMap[input.sort];
      const orderBy = input.order === 'asc' ? asc(sortCol) : desc(sortCol);

      const [totalRows, rows] = await Promise.all([
        ctx.db.select({ count: count() }).from(charts).where(where),
        ctx.db
          .select()
          .from(charts)
          .where(where)
          .orderBy(orderBy)
          .offset((input.page - 1) * input.limit)
          .limit(input.limit),
      ]);

      return {
        items: rows,
        total: totalRows[0]?.count ?? 0,
      };
    }),
});
