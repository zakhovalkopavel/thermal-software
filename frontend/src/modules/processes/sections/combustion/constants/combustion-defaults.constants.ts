import { toNewWallLayerDraft } from '../../../mappers/new-wall-layer-draft.mapper';
import type { CombustionDrafts } from '../types/combustion-drafts.type';
import type { CondensedFuelDraft } from '../types/condensed-fuel-draft.type';

const EMPTY_FUEL: CondensedFuelDraft = {
  source: 'preset',
  fuelId: null,
  name: '',
  elemental: { C: null, H: null, O: null, N: null, S: null, ash: null, moisture: null },
  energyBasis: 'lhv',
  properties: {
    energy_J_kg: null,
    specificHeat_J_kgK: null,
    porosity: null,
    bulkDensity_kg_m3: null,
    particleSize_m: null,
    activityFactor: null,
    emissivity: null,
  },
};

const COMMON = { tFuel_K: null, pO2: null, wH2Om: null };

/** Initial forms = the Swagger examples of each endpoint. */
export const COMBUSTION_DEFAULTS: CombustionDrafts = {
  'solid-direct': {
    fuel: EMPTY_FUEL,
    supply: { basis: 'power', value: 20000 },
    values: { kExcessAir: 1.2, tAir_K: 293, heatLoss_W: null, ...COMMON },
  },
  'solid-two-step': {
    fuel: EMPTY_FUEL,
    supply: { basis: 'power', value: 20000 },
    values: {
      kExcessAir: 1.3,
      primaryExcessAir: null,
      tAirPrimary_K: 293,
      tAirSecondary_K: null,
      generatorHeatLoss_W: null,
      generatorHeatFlux_Wm2: null,
      generatorSurface_m2: null,
      furnaceHeatLoss_W: null,
      ...COMMON,
    },
  },
  fluid: {
    phase: 'gas',
    gasSource: 'custom',
    gasFuelId: null,
    fuelGas: { CH4: 0.95, CO2: 0.01, N2: 0.04 },
    liquidFuel: { ...EMPTY_FUEL, source: 'custom' },
    supply: { basis: 'power', value: 10000 },
    values: { kExcessAir: 1.1, tAir_K: 573, heatLoss_W: null, ...COMMON },
  },
  bed: {
    fuel: EMPTY_FUEL,
    values: {
      bedHeight_m: 0.5,
      diameter_m: 0.3,
      nLayers: 25,
      tAirPrimary_K: 400,
      tAirSecondary_K: 573,
      steamInjectionPercent: null,
      steamT_K: null,
      generatorWallEmissivity: null,
      tAmbient_K: null,
      ...COMMON,
    },
    primaryAir: { basis: 'flow', value: 10 },
    secondaryAir: { basis: 'excess', value: 1.3 },
    generatorWallLayers: [
      toNewWallLayerDraft({ material: 'chamotte_solid', thicknessMm: 65 }),
      toNewWallLayerDraft({ material: 'chamotte_600', thicknessMm: 65 }),
    ],
    furnaceMode: 'none',
    furnace: { diameter_m: 0.4, length_m: 1, emissivity: null },
    furnaceWallLayers: [],
    furnaceHeatLoss_W: null,
  },
};
