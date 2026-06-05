import { describe, expect, it } from 'vitest';

import { createTestCaller } from '../trpc-helper';

describe('health', () => {
  it('should return message "pong" and a timestamp', async () => {
    const caller = createTestCaller();
    const result = await caller.health.ping();

    expect(result.message).toBe('pong');
    expect(result.timestamp).toBeInstanceOf(Date);
  });
});
