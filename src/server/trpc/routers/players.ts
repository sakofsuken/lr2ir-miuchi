import { type SQL, and, count, desc, eq, like } from 'drizzle-orm';
import { z } from 'zod/v4';

import { charts, players, scores } from '@/db/schema';
import { createRouter } from '../init';
import { publicProcedure } from '../procedures';

export const playersRouter = createRouter({
  getStats: publicProcedure.query(async ({ ctx }) => {
    const [playerRows, chartRows, scoreRows] = await Promise.all([
      ctx.db.select({ count: count() }).from(players),
      ctx.db.select({ count: count() }).from(charts),
      ctx.db.select({ count: count() }).from(scores),
    ]);

    return {
      playerCount: playerRows[0]?.count ?? 0,
      chartCount: chartRows[0]?.count ?? 0,
      scoreCount: scoreRows[0]?.count ?? 0,
    };
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: players.id,
          name: players.name,
          danSp: players.danSp,
          danDp: players.danDp,
          playCount: players.playCount,
          fcCount: players.fcCount,
        })
        .from(players)
        .where(eq(players.id, input.id))
        .limit(1);

      return rows[0] ?? null;
    }),

  getScores: publicProcedure
    .input(
      z.object({
        playerId: z.number().int(),
        clear: z.number().int().min(0).max(5).optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions: SQL[] = [eq(scores.playerId, input.playerId)];
      if (input.clear !== undefined) {
        conditions.push(eq(scores.clear, input.clear));
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
            chartTitle: charts.title,
          })
          .from(scores)
          .innerJoin(charts, eq(scores.songMd5, charts.md5))
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
        query: z.string(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const pattern = `%${input.query}%`;
      const where = like(players.name, pattern);

      const [totalRows, rows] = await Promise.all([
        ctx.db.select({ count: count() }).from(players).where(where),
        ctx.db
          .select({
            id: players.id,
            name: players.name,
            danSp: players.danSp,
            danDp: players.danDp,
            playCount: players.playCount,
            fcCount: players.fcCount,
          })
          .from(players)
          .where(where)
          .offset((input.page - 1) * input.limit)
          .limit(input.limit),
      ]);

      return {
        items: rows,
        total: totalRows[0]?.count ?? 0,
      };
    }),
});
