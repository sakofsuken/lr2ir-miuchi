import { count, desc, eq } from 'drizzle-orm';
import { z } from 'zod/v4';

import { courseScores, courses, players } from '@/db/schema';
import { createRouter } from '../init';
import { publicProcedure } from '../procedures';

export const coursesRouter = createRouter({
  getCategories: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .selectDistinct({ category: courses.category })
      .from(courses)
      .orderBy(courses.category);
    return rows.map((r) => r.category).filter((c): c is string => c !== null);
  }),

  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = input.category ? eq(courses.category, input.category) : undefined;

      const [totalRows, rows] = await Promise.all([
        ctx.db.select({ count: count() }).from(courses).where(where),
        ctx.db
          .select()
          .from(courses)
          .where(where)
          .offset((input.page - 1) * input.limit)
          .limit(input.limit),
      ]);

      return {
        items: rows,
        total: totalRows[0]?.count ?? 0,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.select().from(courses).where(eq(courses.id, input.id)).limit(1);

      return rows[0] ?? null;
    }),

  getRanking: publicProcedure
    .input(
      z.object({
        courseId: z.number().int(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = eq(courseScores.courseId, input.courseId);

      const [totalRows, rows] = await Promise.all([
        ctx.db.select({ count: count() }).from(courseScores).where(where),
        ctx.db
          .select({
            courseId: courseScores.courseId,
            playerId: courseScores.playerId,
            clear: courseScores.clear,
            exscore: courseScores.exscore,
            scoreMax: courseScores.scoreMax,
            pg: courseScores.pg,
            gr: courseScores.gr,
            gd: courseScores.gd,
            bd: courseScores.bd,
            pr: courseScores.pr,
            maxcombo: courseScores.maxcombo,
            minbp: courseScores.minbp,
            option1: courseScores.option1,
            option2: courseScores.option2,
            input: courseScores.input,
            client: courseScores.client,
            playerName: players.name,
            playerDanSp: players.danSp,
            playerDanDp: players.danDp,
          })
          .from(courseScores)
          .innerJoin(players, eq(courseScores.playerId, players.id))
          .where(where)
          .orderBy(desc(courseScores.exscore))
          .offset((input.page - 1) * input.limit)
          .limit(input.limit),
      ]);

      return {
        items: rows,
        total: totalRows[0]?.count ?? 0,
      };
    }),
});
