import { createRouter } from './init';
import { authRouter } from './routers/auth';
import { bbsRouter } from './routers/bbs';
import { chartsRouter } from './routers/charts';
import { coursesRouter } from './routers/courses';
import { ghostsRouter } from './routers/ghosts';
import { healthRouter } from './routers/health';
import { playersRouter } from './routers/players';
import { rivalsRouter } from './routers/rivals';
import { tablesRouter } from './routers/tables';

export const appRouter = createRouter({
  auth: authRouter,
  bbs: bbsRouter,
  charts: chartsRouter,
  courses: coursesRouter,
  ghosts: ghostsRouter,
  health: healthRouter,
  players: playersRouter,
  rivals: rivalsRouter,
  tables: tablesRouter,
});

export type AppRouter = typeof appRouter;
