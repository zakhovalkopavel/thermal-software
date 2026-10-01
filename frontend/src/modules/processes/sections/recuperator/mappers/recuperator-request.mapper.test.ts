import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import { toCombustionModeInput } from '../../combustion/mappers/combustion-mode-input.mapper';
import { toCombustionRequest } from '../../combustion/mappers/combustion-request.mapper';
import { RECUPERATOR_DEFAULTS } from '../constants/recuperator-defaults.constants';
import { toRecuperatorInput } from './recuperator-request.mapper';

const FUELS = recordedResponse<FuelSummary[]>('GET /combustion/fuels');
const COMBUSTION = toCombustionModeInput(toCombustionRequest(RECUPERATOR_DEFAULTS.mode, RECUPERATOR_DEFAULTS.combustion, FUELS));
const DRAFT = RECUPERATOR_DEFAULTS.draft;

describe('recuperator › recuperator-request', () => {
  it('maps the circular-channel example', () => {
    expect(toRecuperatorInput(DRAFT, COMBUSTION)).toMatchInlineSnapshot(`
      {
        "combustion": {
          "fluid": {
            "fPower_W": 5000,
            "fuelGas": {
              "CH4": 0.95,
              "CO2": 0.01,
              "N2": 0.04,
            },
            "kExcessAir": 1.2,
            "phase": "gas",
            "tAir_K": 573,
          },
          "mode": "fluid",
        },
        "d0_m": 0.04,
        "holeForm": "circle",
        "nAir": 100,
        "nSmoke": 81,
        "refractoryEmissivity": 0.85,
        "refractoryLambda_WmK": 1.2,
        "refractoryThickness_m": 0.003,
        "smokeTurbulence": false,
        "surfaceArea_m2": 5,
        "surfaceEmissivity": 0.9,
        "tAirStart_K": 573,
        "thermalInsulationThickness_m": 0.05,
        "wantedRecuperatorLength_m": 1.5,
      }
    `);
  });

  it('sends h₀ and passes for circle-in-ring only', () => {
    const values = { ...DRAFT.values, h0_m: 0.01, nPasses: 2 };
    expect(toRecuperatorInput({ ...DRAFT, holeForm: 'circle_in_ring', values }, COMBUSTION)).toMatchObject({ h0_m: 0.01, nPasses: 2 });
    const circle = toRecuperatorInput({ ...DRAFT, values }, COMBUSTION);
    expect(circle).not.toHaveProperty('h0_m');
    expect(circle).not.toHaveProperty('nPasses');
  });

  it('names a missing required field', () => {
    expect(() => toRecuperatorInput({ ...DRAFT, values: { ...DRAFT.values, nAir: null } }, COMBUSTION)).toThrow('Enter Air channels.');
  });
});
