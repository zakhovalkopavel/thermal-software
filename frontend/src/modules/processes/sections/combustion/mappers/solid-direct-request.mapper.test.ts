import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import { COMBUSTION_DEFAULTS } from '../constants/combustion-defaults.constants';
import { toSolidDirectInput } from './solid-direct-request.mapper';

const SOLID = recordedResponse<FuelSummary[]>('GET /combustion/fuels').filter((fuel) => fuel.phase === 'solid');
const DRAFT = COMBUSTION_DEFAULTS['solid-direct'];

describe('combustion › solid-direct-request', () => {
  it('sends optional fields only when filled', () => {
    const input = toSolidDirectInput({ ...DRAFT, values: { ...DRAFT.values, heatLoss_W: 2000 } }, SOLID);
    expect(input).toEqual({ fuelId: 'charcoal-briquette', fPower_W: 20000, kExcessAir: 1.2, tAir_K: 293, heatLoss_W: 2000 });
  });

  it('requires the air temperature', () => {
    expect(() => toSolidDirectInput({ ...DRAFT, values: { ...DRAFT.values, tAir_K: null } }, SOLID)).toThrow('Enter Air T.');
  });
});
