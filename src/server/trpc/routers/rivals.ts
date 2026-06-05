import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod/v4';

import { players, rivals } from '@/db/schema';
import { createRouter } from '../init';
import { authedProcedure, publicProcedure } from '../procedures';

export const rivalsRouter = createRouter({
  list: publicProcedure
    .input(z.object({ playerId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          playerId: rivals.playerId,
          rivalId: rivals.rivalId,
          rivalName: players.name,
          rivalDanSp: players.danSp,
          rivalDanDp: players.danDp,
        })
        .from(rivals)
        .innerJoin(players, eq(rivals.rivalId, players.id))
        .where(eq(rivals.playerId, input.playerId));

      return rows;
    }),

  add: authedProcedure
    .input(z.object({ rivalId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.playerId === input.rivalId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot add yourself as a rival',
        });
      }

      await ctx.db.insert(rivals).values({
        playerId: ctx.session.playerId,
        rivalId: input.rivalId,
      });

      return { success: true };
    }),

  remove: authedProcedure
    .input(z.object({ rivalId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(rivals)
        .where(and(eq(rivals.playerId, ctx.session.playerId), eq(rivals.rivalId, input.rivalId)));

      return { success: true };
    }),
});
