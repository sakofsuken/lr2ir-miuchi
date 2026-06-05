import { createRouter } from './init';
import { healthRouter } from './routers/health';

export const appRouter = createRouter({
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
