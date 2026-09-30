import { CondensedFuel, FuelPhase } from './fuel.interface';
import { FuelId } from '../../enums/fuel-id.enum';
import { RefKey } from '../../../../common/thermal/enum/ref-key.enum';

/** Verified data — legacy furnaceCombustion/classes/FuelDatabase.js, taken without changes */
export const CHARCOAL_BRIQUETTE: CondensedFuel = {
  id:    FuelId.CharcoalBriquette,
  name:  'Charcoal briquette',
  phase: FuelPhase.Solid,
  elementalComp: { C: 0.85, H: 0.03, O: 0.10, N: 0.01, ash: 0.01 },
  porosity: 0.45,
  bulkDensity_kg_m3: 450,
  particleSize_m: 0.05,
  tortuosity: 3.0,
  activityFactor: 1.0,
  heatOfFormation_J_kg: -8500000,
  specificHeat_J_kgK: 1100,
  emissivity: 0.85,
  ref:  RefKey.Basu2006,
  page: 67,
};
