import { RefKey } from '../../../common/thermal/enum/ref-key.enum';
import { FuelPhase } from '../enums/fuel-phase.enum';
import { ElementalComposition } from './elemental-composition.interface';

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
