import { describe, expect, it } from 'vitest';

import { createTestCaller } from '../trpc-helper';

describe('ghosts', () => {
  it('should return false for non-existent ghost', async () => {
    const caller = createTestCaller();
    const result = await caller.ghosts.exists({ md5: 'nonexistent_md5', playerId: 999999 });

    expect(result).toBe(false);
  });
});
