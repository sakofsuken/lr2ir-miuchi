import { TRPCError } from '@trpc/server';
import { count, desc, eq } from 'drizzle-orm';
import { z } from 'zod/v4';

import { bbs, players } from '@/db/schema';
import { createRouter } from '../init';
import { authedProcedure, publicProcedure } from '../procedures';

export const bbsRouter = createRouter({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [totalRows, rows] = await Promise.all([
        ctx.db.select({ count: count() }).from(bbs),
        ctx.db
          .select()
          .from(bbs)
          .orderBy(desc(bbs.id))
          .offset((input.page - 1) * input.limit)
          .limit(input.limit),
      ]);

      return {
        items: rows,
        total: totalRows[0]?.count ?? 0,
      };
    }),

  post: authedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const playerRows = await ctx.db
        .select({ name: players.name })
        .from(players)
        .where(eq(players.id, ctx.session.playerId))
        .limit(1);

      if (playerRows.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Player not found',
        });
      }

      await ctx.db.insert(bbs).values({
        playerId: ctx.session.playerId,
        playerName: playerRows[0].name,
        message: input.message,
        postedAt: new Date().toISOString(),
      });

      return { success: true };
    }),
});
