import { and, eq } from 'drizzle-orm';
import { z } from 'zod/v4';

import { ghosts } from '@/db/schema';
import { createRouter } from '../init';
import { publicProcedure } from '../procedures';

export const ghostsRouter = createRouter({
  exists: publicProcedure
    .input(
      z.object({
        md5: z.string(),
        playerId: z.number().int(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({ songMd5: ghosts.songMd5 })
        .from(ghosts)
        .where(and(eq(ghosts.songMd5, input.md5), eq(ghosts.playerId, input.playerId)))
        .limit(1);

      return rows.length > 0;
    }),
});
