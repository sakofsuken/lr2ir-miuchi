import { describe, expect, it } from 'vitest';

import { createTestCaller } from '../trpc-helper';

describe('players', () => {
  it('should return items and total from search', async () => {
    const caller = createTestCaller();
    const result = await caller.players.search({ query: '' });

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe('number');
  });

  it('should return null for non-existent id', async () => {
    const caller = createTestCaller();
    const result = await caller.players.getById({ id: 999999 });

    expect(result).toBeNull();
  });
});
