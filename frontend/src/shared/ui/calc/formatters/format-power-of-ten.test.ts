import { describe, expect, it } from 'vitest';
import { formatPowerOfTen } from './format-power-of-ten';

describe('calc › formatPowerOfTen', () => {
  it('writes the exponent in superscript, including sign and decimals', () => {
    expect([1, 12, -5, 6.6, 13.5, 0, 2.345].map(formatPowerOfTen)).toEqual(['10¹', '10¹²', '10⁻⁵', '10⁶·⁶', '10¹³·⁵', '10⁰', '10²·³⁵']);
  });
});
