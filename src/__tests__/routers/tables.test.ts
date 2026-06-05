import { describe, expect, it } from 'vitest';

import { createTestCaller } from '../trpc-helper';

describe('tables', () => {
  it('should return an array from list', async () => {
    const caller = createTestCaller();
    const result = await caller.tables.list();

    expect(Array.isArray(result)).toBe(true);
  });
});
