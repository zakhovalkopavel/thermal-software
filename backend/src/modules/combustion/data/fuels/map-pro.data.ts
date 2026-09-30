import { Species } from '../../../thermodynamics/enums/species.enum';
import { FuelPhase, GaseousFuel } from './fuel.interface';
import { FuelId } from '../../enums/fuel-id.enum';

/**
 * MAP-Pro (modern MAP gas): propylene with a little propane, mole fractions.
 * No literature source: composition from the manufacturer SDS (propylene ≥ 99.5 %, propane ≤ 0.5 %),
 * to be confirmed by the user. Classic MAPP (propyne/propadiene stabilised with propane/butane)
 * can be entered via `fuelGas` with C3H4, aC3H4, C3H8, C4H10.
 */
export const MAP_PRO: GaseousFuel = {
  id:    FuelId.MapPro,
  name:  'MAP-Pro gas',
  phase: FuelPhase.Gas,
  moleFractions: { [Species.C3H6]: 0.995, [Species.C3H8]: 0.005 },
};
