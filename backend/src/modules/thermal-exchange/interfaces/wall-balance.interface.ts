import { BetweenLayerDto } from '../dto/between-layer.dto';
import { WallTemperaturePointDto } from '../dto/wall-temperature-point.dto';
import { AlphaResult } from './alpha-result.interface';

/** Heat balance of the wall for one trial inner surface temperature */
export interface WallBalance {
  alphaInner:      AlphaResult;
  fluxInner_W:     number;
  alphaOuter_Wm2K: number;
  fluxOuter_W:     number;
  tOuter:          number;
  betweenTemps:    BetweenLayerDto[];
  /** Finite-difference T(x) using λ(T) at each step */
  temperatureProfile: WallTemperaturePointDto[];
  /** Traverse fell below T_ambient before reaching the outer surface */
  broke:           boolean;
}
