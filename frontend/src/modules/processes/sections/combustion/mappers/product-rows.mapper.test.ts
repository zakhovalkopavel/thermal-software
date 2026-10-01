import { describe, expect, it } from 'vitest';
import { combustionStepResult } from '../../../../../../tests/fixtures/inputs/combustion-step-result';
import { toProductRows } from './product-rows.mapper';

describe('combustion › product-rows', () => {
  it('lists the standard species, then extra ones, with values per step', () => {
    const rows = toProductRows([
      { key: 'generator', label: 'Generator gas', result: combustionStepResult({ excessAir: 0.45 }) },
      { key: 'burnout', label: 'After burnout', result: combustionStepResult() },
    ]);
    expect(rows.map((row) => row.species)).toEqual(['N2', 'O2', 'CO2', 'CO', 'H2O', 'H2', 'SO2', 'Ar']);
    expect(rows[0]).toEqual({
      species: 'N2',
      values: {
        generator: { moleFraction: 0.765, massFlow_kgs: 0.00588 },
        burnout: { moleFraction: 0.765, massFlow_kgs: 0.00588 },
      },
    });
    expect(rows[6].values.burnout).toEqual({ moleFraction: 0.001, massFlow_kgs: 0 });
  });
});
