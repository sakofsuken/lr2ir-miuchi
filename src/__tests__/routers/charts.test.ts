import { describe, expect, it } from 'vitest';

import { createTestCaller } from '../trpc-helper';

describe('charts', () => {
  it('should return items and total from search', async () => {
    const caller = createTestCaller();
    const result = await caller.charts.search({});

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe('number');
  });

  it('should return null for non-existent md5', async () => {
    const caller = createTestCaller();
    const result = await caller.charts.getByMd5({ md5: 'nonexistent_md5_hash' });

    expect(result).toBeNull();
  });
});
