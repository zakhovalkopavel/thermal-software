import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import { COMBUSTION_DEFAULTS } from '../constants/combustion-defaults.constants';
import { toFluidInput } from './fluid-request.mapper';

const GAS = recordedResponse<FuelSummary[]>('GET /combustion/fuels').filter((fuel) => fuel.phase === 'gas');
const DRAFT = COMBUSTION_DEFAULTS.fluid;

describe('combustion › fluid-request', () => {
  it('drops zero gas fractions', () => {
    const input = toFluidInput({ ...DRAFT, fuelGas: { CH4: 0.9, H2: 0.1, CO: 0 } }, GAS);
    expect(input.fuelGas).toEqual({ CH4: 0.9, H2: 0.1 });
    expect(input).not.toHaveProperty('fuelId');
  });

  it('uses the chosen gas preset', () => {
    expect(toFluidInput({ ...DRAFT, gasSource: 'preset', gasFuelId: 'natural-gas' }, GAS).fuelId).toBe('natural-gas');
  });

  it('sends a liquid fuel as a condensed fuel', () => {
    const liquidFuel = {
      ...DRAFT.liquidFuel,
      elemental: { C: 0.86, H: 0.135, O: 0, N: 0, S: 0.005, ash: 0, moisture: null },
      properties: { ...DRAFT.liquidFuel.properties, energy_J_kg: 42.6e6 },
    };
    const input = toFluidInput({ ...DRAFT, phase: 'liquid', liquidFuel }, GAS);
    expect(input).toMatchObject({ phase: 'liquid', fuel: { lhv_J_kg: 42.6e6 } });
  });

  it('rejects an empty gas mix, no preset and missing λ', () => {
    expect(() => toFluidInput({ ...DRAFT, fuelGas: { CH4: 0 } }, GAS)).toThrow('Enter the fuel gas mole fractions.');
    expect(() => toFluidInput({ ...DRAFT, gasSource: 'preset' }, [])).toThrow('Choose a gas preset or enter mole fractions.');
    expect(() => toFluidInput({ ...DRAFT, values: { ...DRAFT.values, kExcessAir: null } }, GAS)).toThrow('Enter Excess air λ.');
  });
});
