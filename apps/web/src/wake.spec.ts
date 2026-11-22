import { describe, expect, it } from 'vitest';
import { ApiError } from './api';
import { isWaking } from './wake';

describe('a server that is waking up', () => {
  it('is a network failure or a gateway error', () => {
    expect(isWaking(new TypeError('Failed to fetch'))).toBe(true);
    for (const status of [502, 503, 504]) expect(isWaking(new ApiError(status, 'x'))).toBe(true);
  });

  it('is not an answer from an awake server or a broken response', () => {
    for (const status of [400, 401, 403, 404, 429, 500])
      expect(isWaking(new ApiError(status, 'x'))).toBe(false);
    expect(isWaking(new SyntaxError('Unexpected token'))).toBe(false);
    expect(isWaking(new Error('schema mismatch'))).toBe(false);
  });
});
