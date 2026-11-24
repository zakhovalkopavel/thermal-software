import { describe, expect, it } from 'vitest';
import { toRangeText } from './correlation-range-text.mapper';

describe('htc › correlation-range-text', () => {
  it('formats both bounds, with ∞ for an open range', () => {
    expect(toRangeText([3000, 5000000])).toMatchInlineSnapshot(`"3000 – 5.000·10⁶"`);
    expect(toRangeText([10000, 'Infinity'])).toMatchInlineSnapshot(`"10000 – ∞"`);
    expect(toRangeText([0.5, 2000])).toMatchInlineSnapshot(`"0.5 – 2000"`);
  });
});
