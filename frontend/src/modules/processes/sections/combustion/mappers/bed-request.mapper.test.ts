import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import { toNewWallLayerDraft } from '../../../mappers/new-wall-layer-draft.mapper';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import { COMBUSTION_DEFAULTS } from '../constants/combustion-defaults.constants';
import { toBedInput } from './bed-request.mapper';

const SOLID = recordedResponse<FuelSummary[]>('GET /combustion/fuels').filter((fuel) => fuel.phase === 'solid');
const DRAFT = COMBUSTION_DEFAULTS.bed;

describe('combustion › bed-request', () => {
  it('maps the default bed form', () => {
    expect(toBedInput(DRAFT, SOLID)).toMatchInlineSnapshot(`
      {
        "airFlow_m3h": 10,
        "bedHeight_m": 0.5,
        "diameter_m": 0.3,
        "fuelId": "charcoal-briquette",
        "generatorWallEmissivity": 0.85,
        "generatorWallLayers": [
          {
            "material": "chamotte_solid",
            "thicknessMm": 65,
          },
          {
            "material": "chamotte_600",
            "thicknessMm": 65,
          },
        ],
        "kExcessAir": 1.3,
        "nLayers": 25,
        "tAirPrimary_K": 400,
        "tAirSecondary_K": 573,
        "tAmbient_K": 293,
      }
    `);
  });

  it('sends mass-based air and the furnace walls', () => {
    const input = toBedInput(
      {
        ...DRAFT,
        primaryAir: { basis: 'mass', value: 0.004 },
        secondaryAir: { basis: 'mass', value: 0.006 },
        generatorWallLayers: [],
        furnaceMode: 'walls',
        furnaceWallLayers: [toNewWallLayerDraft({ material: 'chamotte_1000', thicknessMm: 115 })],
      },
      SOLID,
    );
    expect(input).toMatchObject({
      mAirPrimary_kgs: 0.004,
      mAirSecondary_kgs: 0.006,
      tAmbient_K: 293,
      furnace: { diameter_m: 0.4, length_m: 1, emissivity: 0.85, wallLayers: [{ material: 'chamotte_1000', thicknessMm: 115 }] },
    });
    expect(input).not.toHaveProperty('generatorWallLayers');
    expect(input).not.toHaveProperty('generatorWallEmissivity');
    expect(input).not.toHaveProperty('airFlow_m3h');
  });

  it('sends a furnace heat loss instead of walls', () => {
    const input = toBedInput({ ...DRAFT, furnaceMode: 'loss', furnaceHeatLoss_W: 1500 }, SOLID);
    expect(input.furnaceHeatLoss_W).toBe(1500);
    expect(input).not.toHaveProperty('furnace');
  });

  it('requires the furnace size and wall layers in walls mode', () => {
    expect(() => toBedInput({ ...DRAFT, furnaceMode: 'walls', furnace: { ...DRAFT.furnace, length_m: null } }, SOLID)).toThrow(
      'Enter Furnace length.',
    );
    expect(() =>
      toBedInput({ ...DRAFT, furnaceMode: 'walls', furnaceWallLayers: [toNewWallLayerDraft()] }, SOLID),
    ).toThrow('Furnace wall: choose the material of layer 1.');
  });

  it('requires the geometry and the primary air', () => {
    expect(() => toBedInput({ ...DRAFT, values: { ...DRAFT.values, diameter_m: null } }, SOLID)).toThrow('Enter Generator diameter.');
    expect(() => toBedInput({ ...DRAFT, primaryAir: { basis: 'flow', value: null } }, SOLID)).toThrow('Enter the primary air flow.');
  });

  it('sends and requires the steam temperature only with steam injection', () => {
    expect(toBedInput({ ...DRAFT, values: { ...DRAFT.values, steamInjectionPercent: 10 } }, SOLID)).toMatchObject({
      steamInjectionPercent: 10,
      steamT_K: 500,
    });
    expect(toBedInput(DRAFT, SOLID)).not.toHaveProperty('steamT_K');
    expect(() => toBedInput({ ...DRAFT, values: { ...DRAFT.values, steamInjectionPercent: 10, steamT_K: null } }, SOLID)).toThrow(
      'Enter Steam T.',
    );
  });

  it('requires the surroundings only with generator or furnace walls', () => {
    const noWalls = { ...DRAFT, generatorWallLayers: [], values: { ...DRAFT.values, generatorWallEmissivity: null, tAmbient_K: null } };
    expect(toBedInput(noWalls, SOLID)).not.toHaveProperty('tAmbient_K');
    expect(() => toBedInput({ ...DRAFT, values: { ...DRAFT.values, generatorWallEmissivity: null } }, SOLID)).toThrow(
      'Enter Generator wall emissivity.',
    );
    expect(() =>
      toBedInput({ ...noWalls, furnaceMode: 'walls', furnaceWallLayers: [toNewWallLayerDraft({ material: 'chamotte_1000', thicknessMm: 115 })] }, SOLID),
    ).toThrow('Enter Ambient T.');
  });
});
