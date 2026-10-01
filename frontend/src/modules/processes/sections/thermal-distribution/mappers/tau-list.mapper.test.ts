import { describe, expect, it } from 'vitest';
import { parseTauList } from './tau-list.mapper';

describe('thermal-distribution › tau-list', () => {
  it('parses, de-duplicates and sorts the times', () => {
    expect(parseTauList('120, 30;60 30')).toEqual([30, 60, 120]);
  });

  it('rejects empty, non-positive and too many times', () => {
    expect(() => parseTauList(' ')).toThrow('Enter at least one time.');
    expect(() => parseTauList('30, 0')).toThrow('Times must be positive numbers.');
    expect(() => parseTauList('30, x')).toThrow('Times must be positive numbers.');
    expect(() => parseTauList('1 2 3 4 5 6 7 8 9')).toThrow('Enter at most 8 times.');
  });
});
