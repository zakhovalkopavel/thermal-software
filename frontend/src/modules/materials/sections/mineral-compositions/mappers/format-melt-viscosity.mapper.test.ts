import { describe, expect, it } from 'vitest';
import { formatMeltViscosity } from './format-melt-viscosity.mapper';

describe('mineral-compositions › format-melt-viscosity', () => {
  it('formats model, confidence and Pa·s', () => {
    expect(
      formatMeltViscosity({ model: 'IIDA', confidence: 'LOW', logViscosity: 1.766, viscosity_Pas: 58.38273 }),
    ).toBe('58.38 Pa·s (log₁₀ η = 1.766, IIDA, LOW)');
  });

  it('returns the empty marker when viscosity is missing', () => {
    expect(formatMeltViscosity(null)).toBe('—');
  });
});
