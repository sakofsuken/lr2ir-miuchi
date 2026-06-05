import { TRPCError } from '@trpc/server';
import { describe, expect, it } from 'vitest';

import { createTestCaller } from '../trpc-helper';

describe('rivals', () => {
  it('should throw UNAUTHORIZED when adding rival without session', async () => {
    const caller = createTestCaller();

    try {
      await caller.rivals.add({ rivalId: 1 });
      expect.fail('Expected TRPCError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe('UNAUTHORIZED');
    }
  });
});
