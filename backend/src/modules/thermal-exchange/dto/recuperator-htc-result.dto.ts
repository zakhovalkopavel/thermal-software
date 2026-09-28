import { AlphaResult } from '../interfaces/alpha-result.interface';

export class RecuperatorHtcResultDto {
  alphaSmoke:       AlphaResult;
  alphaAir:         AlphaResult;
  /** Overall (wall-through) HTC at this cross-section [W/(m²·K)] */
  alphaOverall_Wm2K: number;
}
