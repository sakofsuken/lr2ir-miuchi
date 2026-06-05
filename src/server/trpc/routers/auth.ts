import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';

import { players } from '@/db/schema';
import { hashPassword, verifyPassword } from '@/server/auth/password';
import { createSession, deleteSession, getSessionPlayer } from '@/server/auth/session';
import { createRouter } from '../init';
import { authedProcedure, publicProcedure } from '../procedures';

export const authRouter = createRouter({
  login: publicProcedure
    .input(
      z.object({
        lr2id: z.number().int().positive(),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: players.id,
          name: players.name,
          passwordHash: players.passwordHash,
        })
        .from(players)
        .where(eq(players.id, input.lr2id))
        .limit(1);

      if (rows.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' });
      }

      const player = rows[0];

      if (!player.passwordHash) {
        const hashed = await hashPassword(input.password);
        await ctx.db.update(players).set({ passwordHash: hashed }).where(eq(players.id, player.id));
      } else {
        const valid = await verifyPassword(input.password, player.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid password' });
        }
      }

      await createSession(player.id);
      return { id: player.id, name: player.name };
    }),

  logout: publicProcedure.mutation(async () => {
    await deleteSession();
    return { success: true };
  }),

  me: authedProcedure.query(async () => {
    const player = await getSessionPlayer();
    if (!player) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return player;
  }),
});
