import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import { COMBUSTION_DEFAULTS } from '../constants/combustion-defaults.constants';
import { toFuelSelection } from './fuel-selection-request.mapper';

const SOLID = recordedResponse<FuelSummary[]>('GET /combustion/fuels').filter((fuel) => fuel.phase === 'solid');
const PRESET = COMBUSTION_DEFAULTS['solid-direct'].fuel;

describe('combustion › fuel-selection-request', () => {
  it('falls back to the first preset', () => {
    expect(toFuelSelection(PRESET, SOLID, false)).toEqual({ fuelId: 'charcoal-briquette' });
  });

  it('keeps the chosen preset', () => {
    expect(toFuelSelection({ ...PRESET, fuelId: 'charcoal-oak' }, SOLID, false)).toEqual({ fuelId: 'charcoal-oak' });
  });

  it('rejects a preset selection when no presets loaded', () => {
    expect(() => toFuelSelection(PRESET, [], false)).toThrow('Choose a fuel preset or enter a custom fuel.');
  });
});
