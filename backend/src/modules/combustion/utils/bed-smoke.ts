import { Species } from '../../thermodynamics/enums';
import { SmokeCompositionDto } from '../../thermal-exchange/dto/smoke-composition.dto';
import { GasFlows } from '../types';

/** Map bed gas flows (mole fractions or flows) to the wall/HTC smoke DTO. */
export class BedSmoke {
  static composition(y: GasFlows): SmokeCompositionDto {
    return {
      N2:  y[Species.N2]  ?? 0,
      O2:  y[Species.O2]  ?? 0,
      CO2: y[Species.CO2] ?? 0,
      CO:  y[Species.CO]  ?? 0,
      H2O: y[Species.H2O] ?? 0,
      H2:  y[Species.H2]  ?? 0,
    };
  }
}
