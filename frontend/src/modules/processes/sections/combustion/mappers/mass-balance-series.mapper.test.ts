import { describe, expect, it } from 'vitest';
import { combustionStepResult } from '../../../../../../tests/fixtures/inputs/combustion-step-result';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import { toMassBalanceSeries } from './mass-balance-series.mapper';

const [CHARCOAL] = recordedResponse<FuelSummary[]>('GET /combustion/fuels');
const STEP = combustionStepResult({ charCarbon_kgs: 0.00001 });

describe('combustion › mass-balance-series', () => {
  it('puts inputs in the first column and non-zero outputs in the second', () => {
    expect(
      toMassBalanceSeries({
        fuel: CHARCOAL,
        mFuel_kgs: 0.00087,
        fPower_W: 20000,
        tFlame_K: 1850,
        feeds: [
          { label: 'Primary air', kgs: 0.0035 },
          { label: 'Steam', kgs: 0 },
        ],
        steps: [{ key: 'combustion', label: 'Products', result: STEP }],
        lastStep: STEP,
        compositions: [],
        details: [],
      }),
    ).toEqual([
      { name: 'Fuel', data: [0.00087, null] },
      { name: 'Primary air', data: [0.0035, null] },
      { name: 'Flue gas', data: [null, 0.0084] },
      { name: 'Unburnt carbon', data: [null, 0.00001] },
      { name: 'Ash', data: [null, 0.00004] },
    ]);
  });
});
