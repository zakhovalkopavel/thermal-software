import { PHYSICAL_CONSTANTS } from '../../../../common/thermal/constants/physical.constants';
import { MIXTURE_THERMAL_CONDUCTIVITY } from '../../constants/mixture-thermal-conductivity.constants';
import { HirschfelderEuckenSpecies } from '../../types/hirschfelder-eucken-species.type';

/**
 * Hirschfelder–Eucken mixture thermal conductivity (Form A / Poling §10-6):
 * Mason–Saxena mix of translational and internal contributions.
 *
 * Refs: [Hirschfelder1954], [Poling5] §10-6.
 */
export class HirschfelderEucken {
  /**
   * Mixture λ [W/(m·K)] from pure λ_i, η_i, M_i and mole fractions.
   */
  static mix(species: readonly HirschfelderEuckenSpecies[]): number {
    if (species.length === 0) return 0;

    const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;
    const fTr = MIXTURE_THERMAL_CONDUCTIVITY.TRANSLATIONAL_EUCKEN_FACTOR;
    const lambdaTr = species.map((sp) => fTr * (R / sp.M) * sp.eta);
    const lambdaInt = species.map((sp, i) => Math.max(0, sp.lambda - lambdaTr[i]));

    let lambdaTrMix = 0;
    let lambdaIntMix = 0;
    for (let i = 0; i < species.length; i++) {
      const yi = species[i].y;
      let denom = 0;
      for (let j = 0; j < species.length; j++) {
        denom += species[j].y * HirschfelderEucken.masonSaxenaA(
          lambdaTr[i],
          lambdaTr[j],
          species[i].M,
          species[j].M,
        );
      }
      if (denom <= 0) continue;
      lambdaTrMix += yi * lambdaTr[i] / denom;
      lambdaIntMix += yi * lambdaInt[i] / denom;
    }
    return lambdaTrMix + lambdaIntMix;
  }

  /**
   * Mason–Saxena A_ij (Wilke-shaped), using translational conductivities.
   */
  private static masonSaxenaA(
    lambdaTrI: number,
    lambdaTrJ: number,
    Mi: number,
    Mj: number,
  ): number {
    if (lambdaTrJ <= 0) return 1;
    const ratio = Math.sqrt(lambdaTrI / lambdaTrJ) * Math.pow(Mj / Mi, 0.25);
    return Math.pow(1 + ratio, 2) / Math.sqrt(8 * (1 + Mi / Mj));
  }
}
