import { describe, expect, it } from 'vitest';

describe('sample', () => {
  it('adds numbers correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('handles string operations', () => {
    expect('lr2ir-miuchi'.includes('miuchi')).toBe(true);
  });
});
