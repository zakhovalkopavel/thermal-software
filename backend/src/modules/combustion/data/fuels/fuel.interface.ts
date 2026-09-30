import { Species } from '../../../thermodynamics/enums/species.enum';
import { RefKey } from '../../../../common/thermal/enum/ref-key.enum';

export enum FuelPhase {
  Solid  = 'solid',
  Liquid = 'liquid',
  Gas    = 'gas',
}

/** As-fired elemental analysis, mass fractions [-]; C + H + O + N + S + ash + moisture = 1 */
export interface ElementalComposition {
  C:   number;
  H:   number;
  O:   number;
  N:   number;
  S?:  number;
  ash: number;
  /** Free (liquid) water in the fuel */
  moisture?: number;
}

/**
 * Solid or liquid fuel. Field names follow legacy furnaceCombustion/classes/FuelDatabase.js.
 * Either `heatOfFormation_J_kg` or `lhv_J_kg` must be present — the other is derived.
 */
export interface CondensedFuel {
  id:    string;
  name:  string;
  phase: FuelPhase.Solid | FuelPhase.Liquid;
  elementalComp: ElementalComposition;
  heatOfFormation_J_kg?: number;
  /** Lower heating value, as fired (water in products as vapour) */
  lhv_J_kg?: number;
  specificHeat_J_kgK: number;
  // Packed-bed properties (solid fuels, used by the kinetic bed model)
  porosity?:          number;
  bulkDensity_kg_m3?: number;
  particleSize_m?:    number;
  tortuosity?:        number;
  activityFactor?:    number;
  emissivity?:        number;
  /** Literature source (docs/REFERENCES.md); absent for user-defined fuels */
  ref?:  RefKey;
  page?: number;
}

/** Gaseous fuel as a mixture of registered species, mole fractions [-] */
export interface GaseousFuel {
  id:    string;
  name:  string;
  phase: FuelPhase.Gas;
  moleFractions: Partial<Record<Species, number>>;
  ref?:  RefKey;
  page?: number;
}

export type FuelDefinition = CondensedFuel | GaseousFuel;
