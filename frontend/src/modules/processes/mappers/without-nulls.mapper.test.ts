import { describe, expect, it } from 'vitest';
import { withoutNulls } from './without-nulls.mapper';

describe('processes › without-nulls', () => {
  it('drops null and undefined but keeps falsy values', () => {
    expect(withoutNulls({ a: 1, b: null, c: undefined, d: 0, e: false, f: '' })).toEqual({ a: 1, d: 0, e: false, f: '' });
  });
});
