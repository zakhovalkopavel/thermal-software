import { CHAPMAN_ENSKOG } from '../../constants/chapman-enskog.constants';
import { LennardJonesCombining } from '../chapman-enskog/lennard-jones-combining';
import { NeufeldCollisionIntegrals } from '../chapman-enskog/neufeld-collision-integrals';

/**
 * Dilute-gas binary diffusivity via Chapman–Enskog / Poling form.
 * Refs: [Poling5] §11-3.
 */
export class ChapmanEnskogDiffusion {
  /**
   * D₁₂ [m²/s] at T [K], P [atm].
   * @param M_kg_molA molar mass of A [kg/mol]
   * @param M_kg_molB molar mass of B [kg/mol]
   * @param sigma_A_A sigma of A [Å]
   * @param sigma_B_A sigma of B [Å]
   * @param epsilonToKbA ε/k of A [K]
   * @param epsilonToKbB ε/k of B [K]
   */
  static binary(
    M_kg_molA: number,
    M_kg_molB: number,
    sigma_A_A: number,
    sigma_B_A: number,
    epsilonToKbA: number,
    epsilonToKbB: number,
    T_K: number,
    P_atm: number,
  ): number {
    if (!(P_atm > 0)) throw new Error(`Chapman–Enskog D requires P_atm > 0, got ${P_atm}`);
    const M_gA = M_kg_molA * CHAPMAN_ENSKOG.KG_MOL_TO_G_MOL;
    const M_gB = M_kg_molB * CHAPMAN_ENSKOG.KG_MOL_TO_G_MOL;
    const sigma = LennardJonesCombining.sigma12(sigma_A_A, sigma_B_A);
    const eps = LennardJonesCombining.epsilon12(epsilonToKbA, epsilonToKbB);
    const Tstar = T_K / eps;
    const omega = NeufeldCollisionIntegrals.omegaD(Tstar);
    const massTerm = Math.sqrt(1 / M_gA + 1 / M_gB);
    const D_cm2s = CHAPMAN_ENSKOG.D_PREFACTOR_CM2S
      * Math.pow(T_K, 1.5)
      * massTerm
      / (P_atm * sigma * sigma * omega);
    return D_cm2s * 1e-4;
  }
}
