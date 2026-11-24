import { CHARCOAL_BRIQUETTE } from '../data/fuels';

const { name, elementalComp, specificHeat_J_kgK, porosity, particleSize_m, activityFactor } = CHARCOAL_BRIQUETTE;

/** Request fragments shared by the Swagger examples of the combustion endpoints */
export const COMBUSTION_EXAMPLES = {
  /** Briquette analysis sent as a custom fuel, LHV basis instead of the preset's heat of formation */
  CHARCOAL_LHV_30: {
    name: `${name}, LHV 30 MJ/kg`,
    elementalComp,
    lhv_J_kg: 30_000_000,
    specificHeat_J_kgK,
    porosity,
    particleSize_m,
    activityFactor,
  },
  WALL_LAYERS: [
    { material: 'chamotte_solid', thicknessMm: 65 },
    { material: 'chamotte_600',   thicknessMm: 65 },
  ],
  /** Packed-bed generator: geometry and blast air */
  BED: {
    bedHeight_m: 0.5,
    diameter_m: 0.3,
    nLayers: 25,
    airFlow_m3h: 10,
    tAirPrimary_K: 400,
  },
  /** Generator wall surroundings, required with generatorWallLayers */
  BED_WALL: { tAmbient_K: 293, generatorWallEmissivity: 0.85 },
  STEAM_T_K: 500,
  /** Burnout chamber walls (without wall layers) */
  FURNACE: { diameter_m: 0.4, length_m: 1, emissivity: 0.85 },
};
