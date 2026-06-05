import { describe, expect, it } from 'vitest';

import { createTestCaller } from '../trpc-helper';

describe('courses', () => {
  it('should return items and total from list', async () => {
    const caller = createTestCaller();
    const result = await caller.courses.list({});

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe('number');
  });
});
