import { resolve } from 'node:path';

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { beforeAll } from 'vitest';

import * as schema from '@/db/schema';
import { createCallerFactory } from '@/server/trpc/init';
import { appRouter } from '@/server/trpc/router';

const client = createClient({ url: ':memory:' });
const testDb = drizzle(client, { schema });

const createCaller = createCallerFactory(appRouter);

beforeAll(async () => {
  await migrate(testDb, {
    migrationsFolder: resolve(__dirname, '../../drizzle'),
  });
});

export function createTestCaller(session: { playerId: number } | null = null) {
  return createCaller({ db: testDb, session });
}
