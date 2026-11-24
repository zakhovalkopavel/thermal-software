import { describe, expect, it } from 'vitest';
import { gasChartPresentKeys } from './gas-chart-present-keys.mapper';

describe('gases › gas-chart-present-keys', () => {
  it('returns only keys that appear in at least one row, in chart order', () => {
    expect(
      gasChartPresentKeys([
        { Cp_J_kgK: 1000, Pr: 0.7 },
        { Cv_J_kgK: 700, gamma: 1.4, H_J_mol: 1e4 },
      ]),
    ).toEqual(['Cp_J_kgK', 'Cv_J_kgK', 'gamma', 'H_J_mol', 'Pr']);
  });
});
