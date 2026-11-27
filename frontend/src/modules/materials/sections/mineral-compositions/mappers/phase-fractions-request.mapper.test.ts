import { describe, expect, it } from 'vitest';
import { CASTABLE_MIX_FRACTIONS } from '../../../../../../tests/fixtures/inputs/castable-mix-fractions';
import { toPhaseFractions } from './phase-fractions-request.mapper';

describe('mineral-compositions › phase-fractions-request', () => {
  it('sends material, d50 and 0–1 mass fraction', () => {
    expect(toPhaseFractions(CASTABLE_MIX_FRACTIONS.slice(2, 4))).toEqual([
      { materialId: 'alumina_calcined', d50_mm: 0.2, massFraction: 0.2 },
      { materialId: 'cac_ca70', d50_mm: 0.01, massFraction: 0.15 },
    ]);
  });
});
