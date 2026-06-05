import { publicProcedure } from '../procedures';
import { createRouter } from '../init';

export const healthRouter = createRouter({
  ping: publicProcedure.query(() => {
    return { message: 'pong', timestamp: new Date() };
  }),
});
