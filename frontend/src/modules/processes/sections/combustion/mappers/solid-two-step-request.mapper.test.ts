import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import { COMBUSTION_DEFAULTS } from '../constants/combustion-defaults.constants';
import { toSolidTwoStepInput } from './solid-two-step-request.mapper';

const SOLID = recordedResponse<FuelSummary[]>('GET /combustion/fuels').filter((fuel) => fuel.phase === 'solid');
const DRAFT = COMBUSTION_DEFAULTS['solid-two-step'];

describe('combustion › solid-two-step-request', () => {
  it('sends the mass-flow supply and the filled optional fields', () => {
    const input = toSolidTwoStepInput(
      { ...DRAFT, supply: { basis: 'mass', value: 0.001 }, values: { ...DRAFT.values, primaryExcessAir: 0.5 } },
      SOLID,
    );
    expect(input).toEqual({ fuelId: 'charcoal-briquette', mFuel_kgs: 0.001, kExcessAir: 1.3, tAirPrimary_K: 293, primaryExcessAir: 0.5 });
  });

  it('requires the primary air temperature', () => {
    expect(() => toSolidTwoStepInput({ ...DRAFT, values: { ...DRAFT.values, tAirPrimary_K: null } }, SOLID)).toThrow(
      'Enter Primary air T.',
    );
  });
});
