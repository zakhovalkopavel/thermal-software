import { describe, expect, it } from 'vitest';
import { formatOxideComposition } from './format-oxide-composition.mapper';

describe('mineral-compositions › format-oxide-composition', () => {
  it('sorts oxides by descending wt%', () => {
    expect(formatOxideComposition({ CaO: 23, Al2O3: 44.4, SiO2: 30.1 })).toBe('Al2O3 44.4 · SiO2 30.1 · CaO 23');
  });

  it('returns the empty marker when there are no positive oxides', () => {
    expect(formatOxideComposition({})).toBe('—');
  });
});
