import { createRouter } from './init';
import { authRouter } from './routers/auth';
import { healthRouter } from './routers/health';

export const appRouter = createRouter({
  auth: authRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
