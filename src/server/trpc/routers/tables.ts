import { and, count, eq } from 'drizzle-orm';
import { z } from 'zod/v4';

import { charts, tableCharts, tables } from '@/db/schema';
import { createRouter } from '../init';
import { publicProcedure } from '../procedures';

export const tablesRouter = createRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(tables);
  }),

  getLevels: publicProcedure
    .input(z.object({ tableId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          level: tableCharts.level,
          count: count(),
        })
        .from(tableCharts)
        .where(eq(tableCharts.tableId, input.tableId))
        .groupBy(tableCharts.level);

      return rows;
    }),

  getCharts: publicProcedure
    .input(
      z.object({
        tableId: z.number().int(),
        level: z.string(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = and(eq(tableCharts.tableId, input.tableId), eq(tableCharts.level, input.level));

      const [totalRows, rows] = await Promise.all([
        ctx.db.select({ count: count() }).from(tableCharts).where(where),
        ctx.db
          .select({
            tableId: tableCharts.tableId,
            chartMd5: tableCharts.chartMd5,
            level: tableCharts.level,
            title: charts.title,
            artist: charts.artist,
            genre: charts.genre,
            keys: charts.keys,
            playCount: charts.playCount,
            clearCount: charts.clearCount,
          })
          .from(tableCharts)
          .innerJoin(charts, eq(tableCharts.chartMd5, charts.md5))
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
