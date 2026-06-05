import { and, count, desc, eq, like, or } from 'drizzle-orm';
import { z } from 'zod/v4';

import { charts, players, scores } from '@/db/schema';
import { createRouter } from '../init';
import { publicProcedure } from '../procedures';

export const chartsRouter = createRouter({
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
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.query) {
        const pattern = `%${input.query}%`;
        conditions.push(
          or(
            like(charts.title, pattern),
            like(charts.artist, pattern),
            like(charts.genre, pattern),
          ),
        );
      }

      if (input.keys) {
        conditions.push(eq(charts.keys, input.keys));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [totalRows, rows] = await Promise.all([
        ctx.db.select({ count: count() }).from(charts).where(where),
        ctx.db
          .select()
          .from(charts)
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
