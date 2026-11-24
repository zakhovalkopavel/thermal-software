import { describe, expect, it } from 'vitest';
import { combustionStepResult } from '../../../../../../tests/fixtures/inputs/combustion-step-result';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import { toSmokeHandOff } from './smoke-hand-off.mapper';

const [CHARCOAL] = recordedResponse<FuelSummary[]>('GET /combustion/fuels');

const summary = (moleFractions: Record<string, number>) => {
  const step = combustionStepResult({ products: { ...combustionStepResult().products, moleFractions } });
  return {
    fuel: CHARCOAL,
    mFuel_kgs: 0.00087,
    fPower_W: 20000,
    tFlame_K: 1850,
    feeds: [],
    steps: [],
    lastStep: step,
    compositions: [],
    details: [],
  };
};

describe('combustion › smoke-hand-off', () => {
  it('keeps the six smoke species renormalised to Σ = 1', () => {
    const handOff = toSmokeHandOff(summary(combustionStepResult().products.moleFractions));
    expect(handOff).toMatchInlineSnapshot(`
      {
        "composition": {
          "CO": 0,
          "CO2": 0.164164,
          "H2": 0,
          "H2O": 0.037037,
          "N2": 0.765766,
          "O2": 0.033033,
        },
        "mGas_kgs": 0.0084,
        "tFlame_K": 1850,
      }
    `);
    const total = Object.values(handOff.composition).reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it('gives zeros when no smoke species are present', () => {
    expect(Object.values(toSmokeHandOff(summary({ Ar: 1 })).composition)).toEqual([0, 0, 0, 0, 0, 0]);
  });
});
