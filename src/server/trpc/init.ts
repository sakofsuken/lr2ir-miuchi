import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

import { db } from '@/db';

export function createContext() {
  return {
    db,
    session: null as { playerId: number } | null,
  };
}

export type Context = ReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const middleware = t.middleware;
export const baseProcedure = t.procedure;
