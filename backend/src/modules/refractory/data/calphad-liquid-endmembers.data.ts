import type { CalphadLiquidEndmember } from '../types/calphad-liquid-endmember.type';

/** Oxide liquid end-members with NASA-9 `(L)` species for ideal mixing. */
export const CALPHAD_LIQUID_ENDMEMBERS: readonly CalphadLiquidEndmember[] = [
  { oxide: 'Al2O3', compoundId: 'aluminium_oxide', nasa9Key: 'AL2O3(L)' },
  { oxide: 'SiO2', compoundId: 'silica', nasa9Key: 'SiO2(L)' },
  { oxide: 'CaO', compoundId: 'lime', nasa9Key: 'CaO(L)' },
  { oxide: 'MgO', compoundId: 'magnesium_oxide', nasa9Key: 'MgO(L)' },
  { oxide: 'TiO2', compoundId: 'titanium_dioxide', nasa9Key: 'TiO2(L)' },
];
