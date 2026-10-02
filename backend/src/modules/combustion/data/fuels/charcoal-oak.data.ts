import { CondensedFuel } from '../../interfaces';
import { FuelPhase } from '../../enums/fuel-phase.enum';
import { FuelId } from '../../enums/fuel-id.enum';
import { RefKey } from '../../../../common/thermal/enum/ref-key.enum';

/** Verified data — legacy furnaceCombustion/classes/FuelDatabase.js, taken without changes */
export const CHARCOAL_OAK: CondensedFuel = {
  id:    FuelId.CharcoalOak,
  name:  'Oak charcoal',
  phase: FuelPhase.Solid,
  elementalComp: { C: 0.82, H: 0.04, O: 0.12, N: 0.01, ash: 0.01 },
  porosity: 0.50,
  bulkDensity_kg_m3: 380,
  particleSize_m: 0.03,
  tortuosity: 2.8,
  activityFactor: 1.1,
  heatOfFormation_J_kg: -8200000,
  specificHeat_J_kgK: 1050,
  emissivity: 0.83,
  ref:  RefKey.VanKrevelen1993,
  page: 235,
};
