import { describe, expect, it } from 'vitest';
import { toRangeBounds } from './correlation-range-bounds.mapper';

describe('htc › correlation-range-bounds', () => {
  it('keeps numeric bounds', () => {
    expect(toRangeBounds([3000, 5000000])).toEqual({ min: 3000, max: 5000000 });
  });

  it('maps the serialised "Infinity" to +∞', () => {
    expect(toRangeBounds([10000, 'Infinity'])).toEqual({ min: 10000, max: Number.POSITIVE_INFINITY });
  });
});
