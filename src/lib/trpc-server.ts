import 'server-only';

import { createCallerFactory } from '@/server/trpc/init';
import { createContext } from '@/server/trpc/init';
import { appRouter } from '@/server/trpc/router';

const createCaller = createCallerFactory(appRouter);

export async function createServerCaller() {
  const context = await createContext();
  return createCaller(context);
}
