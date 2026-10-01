import { describe, expect, it } from 'vitest';
import { toPureGasRow } from './pure-gas-row.mapper';

const CP = { Cp_J_kgK: 1040.2, Cv_J_kgK: 743.4, gamma: 1.4, molecularWeight_kg_mol: 0.028013, T_K: 300 };
const PRANDTL = {
  value: 0.716,
  symbol: 'Pr',
  resolvedFluid: { rho_kg_m3: 1.138, mu_Pa_s: 1.79e-5, Cp_J_kgK: 1041, lambda: 0.0259, nu_m2s: 1.57e-5 },
};

describe('gases › pure-gas-row', () => {
  it('merges the Cp and Prandtl responses into one row', () => {
    expect(toPureGasRow('N2', 300, CP, PRANDTL, [])).toMatchInlineSnapshot(`
      {
        "Cp_J_kgK": 1040.2,
        "Cv_J_kgK": 743.4,
        "Pr": 0.716,
        "T_K": 300,
        "errors": [],
        "gamma": 1.4,
        "gas": "N2",
        "lambda_WmK": 0.0259,
        "molecularWeight_kg_mol": 0.028013,
        "mu_Pa_s": 0.0000179,
        "nu_m2s": 0.0000157,
        "rho_kg_m3": 1.138,
      }
    `);
  });

  it('falls back to the Prandtl Cp and leaves the rest undefined when Cp failed', () => {
    const error = new Error('Cp out of range');
    const row = toPureGasRow('N2', 300, undefined, PRANDTL, [error]);
    expect(row).toMatchObject({ Cp_J_kgK: 1041, Pr: 0.716, errors: [error] });
    expect(row.Cv_J_kgK).toBeUndefined();
    expect(row.gamma).toBeUndefined();
  });

  it('keeps only Cp-derived values when Prandtl failed', () => {
    const row = toPureGasRow('N2', 300, CP, undefined, []);
    expect(row).toMatchObject({ Cp_J_kgK: 1040.2, gamma: 1.4 });
    expect(row.Pr).toBeUndefined();
    expect(row.rho_kg_m3).toBeUndefined();
  });
});
