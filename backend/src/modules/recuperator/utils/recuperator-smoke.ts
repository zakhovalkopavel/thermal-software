import { SmokeCompositionDto } from '../../thermal-exchange/dto/smoke-composition.dto';
import { RECUPERATOR } from '../constants/recuperator.constants';

/**
 * Flue-gas mole fractions reduced to the species of the heat-transfer model,
 * renormalised (SO2, Ar dropped).
 */
export class RecuperatorSmoke {
  static toComposition(y: Record<string, number>): SmokeCompositionDto {
    const total = RECUPERATOR.SMOKE_SPECIES.reduce((s, sp) => s + (y[sp] ?? 0), 0);
    const out = {} as SmokeCompositionDto;
    for (const sp of RECUPERATOR.SMOKE_SPECIES) out[sp] = (y[sp] ?? 0) / total;
    return out;
  }
}
