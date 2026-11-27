import { PHYSICAL_CONSTANTS } from '../../../common/thermal/constants/physical.constants';
import { celsiusToKelvin } from '../../../common/thermal/utils/temperature/celsius-to-kelvin.util';
import { GRAIN_REACTION_CONSTANTS } from '../constants/grain-reaction.constants';

/**
 * Grain-reaction model: reaction penetration depth into a grain and the
 * resulting reacted volume fraction of a spherical grain.
 */
export class GrainReaction {
  /**
   * Reaction penetration depth δ [mm].
   *
   * δ = δ_ref · √(t / t_ref) · exp(−E / (2R) · (1/T − 1/T_ref))
   */
  static penetrationDepth_mm(
    activationEnergy_Jmol: number,
    temperature_C: number,
    holdTime_hours: number,
  ): number {
    const T_K = celsiusToKelvin(temperature_C);
    const Tref_K = celsiusToKelvin(GRAIN_REACTION_CONSTANTS.referenceTemperature_C);
    const timeRatio = holdTime_hours / GRAIN_REACTION_CONSTANTS.referenceHoldTime_hours;
    const arrhenius = Math.exp(
      -(activationEnergy_Jmol / (2 * PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK)) * (1 / T_K - 1 / Tref_K),
    );
    return GRAIN_REACTION_CONSTANTS.penetrationDepthRef_mm * Math.sqrt(timeRatio) * arrhenius;
  }

  /**
   * Reacted volume fraction X of a spherical grain of median diameter d50.
   *
   * X = 1 − (1 − 2δ/d)³ if 2δ < d, otherwise 1.
   */
  static reactedFraction(d50_mm: number, penetrationDepth_mm: number): number {
    if (2 * penetrationDepth_mm >= d50_mm) return 1;
    return 1 - Math.pow(1 - (2 * penetrationDepth_mm) / d50_mm, 3);
  }
}
