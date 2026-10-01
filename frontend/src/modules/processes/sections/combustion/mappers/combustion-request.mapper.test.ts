import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import { COMBUSTION_DEFAULTS } from '../constants/combustion-defaults.constants';
import { toCombustionRequest } from './combustion-request.mapper';

const FUELS = recordedResponse<FuelSummary[]>('GET /combustion/fuels');

describe('combustion › combustion-request', () => {
  it('maps the default solid-direct form with the first solid preset', () => {
    expect(toCombustionRequest('solid-direct', COMBUSTION_DEFAULTS, FUELS)).toMatchInlineSnapshot(`
      {
        "input": {
          "fPower_W": 20000,
          "fuelId": "charcoal-briquette",
          "kExcessAir": 1.2,
          "tAir_K": 293,
        },
        "mode": "solid-direct",
      }
    `);
  });

  it('maps the default solid-two-step form', () => {
    expect(toCombustionRequest('solid-two-step', COMBUSTION_DEFAULTS, FUELS)).toMatchInlineSnapshot(`
      {
        "input": {
          "fPower_W": 20000,
          "fuelId": "charcoal-briquette",
          "kExcessAir": 1.3,
          "tAirPrimary_K": 293,
        },
        "mode": "solid-two-step",
      }
    `);
  });

  it('maps the default fluid form with custom gas fractions', () => {
    expect(toCombustionRequest('fluid', COMBUSTION_DEFAULTS, FUELS)).toMatchInlineSnapshot(`
      {
        "input": {
          "fPower_W": 10000,
          "fuelGas": {
            "CH4": 0.95,
            "CO2": 0.01,
            "N2": 0.04,
          },
          "kExcessAir": 1.1,
          "phase": "gas",
          "tAir_K": 573,
        },
        "mode": "fluid",
      }
    `);
  });

  it('uses the first gas preset for a preset fluid form', () => {
    const drafts = { ...COMBUSTION_DEFAULTS, fluid: { ...COMBUSTION_DEFAULTS.fluid, gasSource: 'preset' as const } };
    expect(toCombustionRequest('fluid', drafts, FUELS).input).toMatchObject({ fuelId: 'map-pro' });
  });

  it('tags the bed request with its mode', () => {
    expect(toCombustionRequest('bed', COMBUSTION_DEFAULTS, FUELS).mode).toBe('bed');
  });
});
