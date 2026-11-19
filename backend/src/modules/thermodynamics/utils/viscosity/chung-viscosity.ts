import { CHUNG_VISCOSITY } from '../../constants/chung-viscosity.constants';
import { ChungMixtureParams } from '../../types/chung-mixture-params.type';
import { NeufeldCollisionIntegrals } from '../chapman-enskog/neufeld-collision-integrals';
import { ChungThermalConductivity } from '../conductivity/chung-thermal-conductivity';

/**
 * Chung et al. (1988) dense-gas viscosity (Poling §§9-6 / 9-7).
 * Reuses §9-5 mixing helpers from `ChungThermalConductivity`.
 * Refs: [Chung1988], [Poling5].
 */
export class ChungViscosity {
  /**
   * Dilute (low-density limit) Chung μ [Pa·s] (Poling Eq. 9-4.18 form).
   * Used as the zero-density baseline for Δη = μ(T,V) − μ⁰(T).
   */
  static diluteViscosity(T_K: number, mix: ChungMixtureParams): number {
    const C = CHUNG_VISCOSITY;
    const { Fc, omegaV } = ChungViscosity.reducedState(T_K, mix);
    const Vc_cm3 = mix.Vc * 1e6;
    const M_gmol = mix.M * 1000;
    const mu_microP = C.DILUTE_PREFACTOR_MICROP * Fc * Math.sqrt(M_gmol * T_K)
      / (Math.pow(Vc_cm3, 2 / 3) * omegaV);
    return mu_microP * C.MU_MICROP_TO_PA_S;
  }

  /**
   * Dense-gas viscosity [Pa·s] at T and molar volume V.
   * Complete Chung method (dilute + dense corresponding-states).
   */
  static viscosity(T_K: number, mix: ChungMixtureParams, V_m3_mol: number): number {
    const C = CHUNG_VISCOSITY;
    const y = ChungThermalConductivity.densityParameterY(mix.Vc, V_m3_mol);
    if (y <= 0 || y >= 1) {
      throw new Error(`Chung μ: density parameter y=${y} is outside (0,1)`);
    }

    const mur4 = mix.mur ** 4;
    const E = C.TABLE_E.map(([a, b, c, d]) => a + b * mix.omega + c * mur4 + d * mix.kappa);
    const [E1, E2, E3, E4, E5, E6, E7, E8, E9, E10] = E;

    const { Fc, Tstar, omegaV } = ChungViscosity.reducedState(T_K, mix);

    const oneMinusY = 1 - y;
    const G1 = (1 - 0.5 * y) / (oneMinusY * oneMinusY * oneMinusY);
    const G2 = (E1 / y * (1 - Math.exp(-E4 * y)) + E2 * G1 * Math.exp(E5 * y) + E3 * G1)
      / (E1 * E4 + E2 + E3);

    const muStarStar = E7 * y * y * G2 * Math.exp(E8 + E9 / Tstar + E10 / (Tstar * Tstar));
    const muStar = Math.sqrt(Tstar) / omegaV * Fc * (1 / G2 + E6 * y) + muStarStar;

    const Vc_cm3 = mix.Vc * 1e6;
    const M_gmol = mix.M * 1000;
    const mu_microP = muStar * C.DENSE_PREFACTOR_MICROP
      * Math.sqrt(M_gmol * mix.Tc)
      / Math.pow(Vc_cm3, 2 / 3);
    return mu_microP * C.MU_MICROP_TO_PA_S;
  }

  private static reducedState(T_K: number, mix: ChungMixtureParams): {
    Fc: number;
    Tstar: number;
    omegaV: number;
  } {
    const C = CHUNG_VISCOSITY;
    const mur4 = mix.mur ** 4;
    const Fc = 1 - C.FC_OMEGA * mix.omega + C.FC_MUR4 * mur4 + mix.kappa;
    const Tstar = C.T_STAR_FROM_TR * T_K / mix.Tc;
    return { Fc, Tstar, omegaV: NeufeldCollisionIntegrals.omegaV(Tstar) };
  }
}
