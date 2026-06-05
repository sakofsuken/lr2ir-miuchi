import { TRPCError } from '@trpc/server';
import { describe, expect, it } from 'vitest';

import { createTestCaller } from '../trpc-helper';

describe('bbs', () => {
  it('should return items and total from list', async () => {
    const caller = createTestCaller();
    const result = await caller.bbs.list({});

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe('number');
  });

  it('should throw UNAUTHORIZED when posting without session', async () => {
    const caller = createTestCaller();

    try {
      await caller.bbs.post({ message: 'test message' });
      expect.fail('Expected TRPCError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe('UNAUTHORIZED');
    }
  });
});
