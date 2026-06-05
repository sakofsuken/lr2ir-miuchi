import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { createContext } from '@/server/trpc/init';
import { appRouter } from '@/server/trpc/router';

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(),
  });
}

export { handler as GET, handler as POST };
