import { Species } from '../../thermodynamics/enums';
import { RefKey } from '../../../common/thermal/enum/ref-key.enum';
import { FuelPhase } from '../enums/fuel-phase.enum';

/** Gaseous fuel as a mixture of registered species, mole fractions [-] */
export interface GaseousFuel {
  id:    string;
  name:  string;
  phase: FuelPhase.Gas;
  moleFractions: Partial<Record<Species, number>>;
  ref?:  RefKey;
  page?: number;
}
