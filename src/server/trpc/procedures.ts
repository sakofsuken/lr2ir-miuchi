import { TRPCError } from '@trpc/server';

import { baseProcedure, middleware } from './init';

export const publicProcedure = baseProcedure;

const enforceAuth = middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      session: ctx.session,
    },
  });
});

export const authedProcedure = baseProcedure.use(enforceAuth);
