import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

import { db } from '@/db';
import { getSession } from '@/server/auth/session';

export async function createContext() {
  const session = await getSession();
  return {
    db,
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const middleware = t.middleware;
export const baseProcedure = t.procedure;
