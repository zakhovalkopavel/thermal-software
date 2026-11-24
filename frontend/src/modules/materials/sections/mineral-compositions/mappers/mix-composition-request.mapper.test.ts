import { describe, expect, it } from 'vitest';
import { CASTABLE_MIX_FRACTIONS } from '../../../../../../tests/fixtures/inputs/castable-mix-fractions';
import { toMixCompositionInput } from './mix-composition-request.mapper';

describe('mineral-compositions › mix-composition-request', () => {
  it('sends every row with its mass fraction (0–1)', () => {
    expect(toMixCompositionInput(CASTABLE_MIX_FRACTIONS.slice(0, 2))).toEqual({
      fractions: [
        { materialId: 'alumina_tabular', massFraction: 0.35 },
        { materialId: 'alumina_tabular', massFraction: 0.25 },
      ],
    });
  });

  it('is null for an empty mix', () => {
    expect(toMixCompositionInput([])).toBeNull();
  });
});
