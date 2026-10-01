import { describe, expect, it } from 'vitest';
import { combustionStepResult } from '../../../../../../tests/fixtures/inputs/combustion-step-result';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import type { CombustionSummary } from '../types/combustion-summary.type';
import { toCombustionSummary } from './combustion-summary.mapper';

const [CHARCOAL] = recordedResponse<FuelSummary[]>('GET /combustion/fuels');
const STEP = combustionStepResult();
const GENERATOR_STEP = combustionStepResult({ tOut_K: 1100, excessAir: 0.45 });

const outline = (summary: CombustionSummary) => ({
  feeds: summary.feeds,
  steps: summary.steps.map((step) => step.key),
  lastStep: summary.lastStep.tOut_K,
  compositions: summary.compositions.map((composition) => composition.label),
  details: summary.details,
  tStep1_K: summary.tStep1_K,
  layers: summary.layers?.length,
});

describe('combustion › combustion-summary', () => {
  it('summarises a single-step result', () => {
    const summary = toCombustionSummary({
      mode: 'fluid',
      result: { fuel: CHARCOAL, mFuel_kgs: 0.00087, fPower_W: 20000, mAir_kgs: 0.0075, tFlame_K: 1850, combustion: STEP },
    });
    expect(outline(summary)).toMatchInlineSnapshot(`
      {
        "compositions": [
          "Products",
        ],
        "details": [
          {
            "label": "Excess air",
            "value": 1.2,
          },
        ],
        "feeds": [
          {
            "kgs": 0.0075,
            "label": "Air",
          },
        ],
        "lastStep": 1850,
        "layers": undefined,
        "steps": [
          "combustion",
        ],
        "tStep1_K": undefined,
      }
    `);
  });

  it('summarises a two-step result with generator and burnout', () => {
    const summary = toCombustionSummary({
      mode: 'solid-two-step',
      result: {
        fuel: CHARCOAL,
        mFuel_kgs: 0.00087,
        fPower_W: 20000,
        primaryExcessAir: 0.45,
        mAirPrimary_kgs: 0.0035,
        mAirSecondary_kgs: 0.0055,
        tStep1_K: 1100,
        tFlame_K: 1850,
        generator: GENERATOR_STEP,
        burnout: STEP,
      },
    });
    expect(outline(summary)).toMatchInlineSnapshot(`
      {
        "compositions": [
          "Generator gas",
          "After burnout",
        ],
        "details": [
          {
            "label": "Primary excess air",
            "value": 0.45,
          },
        ],
        "feeds": [
          {
            "kgs": 0.0035,
            "label": "Primary air",
          },
          {
            "kgs": 0.0055,
            "label": "Secondary air",
          },
        ],
        "lastStep": 1850,
        "layers": undefined,
        "steps": [
          "generator",
          "burnout",
        ],
        "tStep1_K": 1100,
      }
    `);
  });

  it('summarises a bed result with its layers and balance details', () => {
    const summary = toCombustionSummary({
      mode: 'bed',
      result: {
        fuel: CHARCOAL,
        layers: [],
        mFuel_kgs: 0.0011,
        fPower_W: 25000,
        carbonBurnRate_kgs: 0.0009,
        ash_kgs: 0.00004,
        mAirPrimary_kgs: 0.0034,
        mSteam_kgs: 0,
        mAirSecondary_kgs: 0.006,
        primaryExcessAir: 0.4,
        generatorHeatLoss_W: 900,
        pressureDrop_Pa: 85,
        oxidationZoneHeight_m: null,
        tStep1_K: 1050,
        generatorGasMoleFlows_mols: { CO: 0.05, N2: 0.12 },
        generatorGasMoleFractions: { CO: 0.29, N2: 0.71 },
        mGeneratorGas_kgs: 0.0045,
        elementBalanceResidual: 1e-10,
        energyBalanceResidual_W: 0.3,
        tFlame_K: 1780,
        burnout: STEP,
      },
    });
    expect(outline(summary)).toMatchInlineSnapshot(`
      {
        "compositions": [
          "Generator gas",
          "After burnout",
        ],
        "details": [
          {
            "label": "Primary excess air",
            "value": 0.4,
          },
          {
            "label": "Generator gas",
            "unit": "kg/s",
            "value": 0.0045,
          },
          {
            "label": "Carbon burn rate",
            "unit": "kg/s",
            "value": 0.0009,
          },
          {
            "label": "Generator heat loss",
            "unit": "W",
            "value": 900,
          },
          {
            "label": "Bed pressure drop",
            "unit": "Pa",
            "value": 85,
          },
          {
            "label": "Oxidation zone height",
            "unit": "m",
            "value": null,
          },
          {
            "label": "Energy balance residual",
            "unit": "W",
            "value": 0.3,
          },
        ],
        "feeds": [
          {
            "kgs": 0.0034,
            "label": "Primary air",
          },
          {
            "kgs": 0,
            "label": "Steam",
          },
          {
            "kgs": 0.006,
            "label": "Secondary air",
          },
        ],
        "lastStep": 1850,
        "layers": 0,
        "steps": [
          "burnout",
        ],
        "tStep1_K": 1050,
      }
    `);
  });
});
