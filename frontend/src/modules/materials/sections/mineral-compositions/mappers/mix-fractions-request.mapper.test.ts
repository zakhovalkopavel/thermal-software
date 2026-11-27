import { describe, expect, it } from 'vitest';
import { toMixFractions } from './mix-fractions-request.mapper';

describe('mineral-compositions › mix-fractions-request', () => {
  it('keeps material and 0–1 mass fraction only', () => {
    expect(
      toMixFractions([
        { materialId: 'alumina_tabular', massFraction: 0.35, d50_mm: 4.5 },
        { materialId: 'cac_ca70', massFraction: 0.15, d50_mm: 0.015 },
      ]),
    ).toEqual([
      { materialId: 'alumina_tabular', massFraction: 0.35 },
      { materialId: 'cac_ca70', massFraction: 0.15 },
    ]);
  });
});
