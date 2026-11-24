import type { ElementalComposition } from './elemental-composition.type';

export type CondensedFuel = {
  name?: string;
  elementalComp: ElementalComposition;
  /** One of heatOfFormation_J_kg / lhv_J_kg is required. */
  heatOfFormation_J_kg?: number;
  lhv_J_kg?: number;
  specificHeat_J_kgK?: number;
  /** Bed model fields. */
  porosity?: number;
  bulkDensity_kg_m3?: number;
  particleSize_m?: number;
  activityFactor?: number;
  emissivity?: number;
};
