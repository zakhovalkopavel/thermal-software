import type { CombustionMode } from '../../../types/combustion-mode.type';
import { COMBUSTION_DEFAULTS } from '../../combustion/constants/combustion-defaults.constants';
import type { CombustionDrafts } from '../../combustion/types/combustion-drafts.type';
import type { RecuperatorDraft } from '../types/recuperator-draft.type';

const MODE: CombustionMode = 'fluid';

const COMBUSTION: CombustionDrafts = {
  ...COMBUSTION_DEFAULTS,
  fluid: {
    ...COMBUSTION_DEFAULTS.fluid,
    supply: { basis: 'power', value: 5000 },
    values: { ...COMBUSTION_DEFAULTS.fluid.values, kExcessAir: 1.2, tAir_K: 573 },
  },
};

const DRAFT: RecuperatorDraft = {
  holeForm: 'circle',
  smokeTurbulence: false,
  values: {
    tAirStart_K: 573,
    d0_m: 0.04,
    h0_m: null,
    refractoryThickness_m: 0.003,
    nAir: 100,
    nSmoke: 81,
    nPasses: null,
    wantedRecuperatorLength_m: 1.5,
    thermalInsulationThickness_m: 0.05,
    refractoryLambda_WmK: 1.2,
    refractoryEmissivity: 0.85,
    surfaceEmissivity: 0.9,
    surfaceArea_m2: 5,
    airPreheat_K: null,
  },
};

/** The `circleChannels` Swagger example: 5 kW natural-gas furnace, 100 air / 81 smoke circular channels. */
export const RECUPERATOR_DEFAULTS = { mode: MODE, combustion: COMBUSTION, draft: DRAFT };
