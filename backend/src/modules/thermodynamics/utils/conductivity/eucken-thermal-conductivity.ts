import { PHYSICAL_CONSTANTS } from '../../../../common/thermal/constants/physical.constants';
import { EUCKEN_FACTOR } from '../../constants/eucken-factor.constants';

/**
 * Dilute-gas Eucken / modified-Eucken λ from viscosity.
 * Classical: λ = (Cp + 1.25·R)·μ / M.
 * Modified (Svehla Z): λ = (μ/M)·[(5/2)·(3/2)R + Z·(Cp − 5/2·R)].
 * Refs: [Svehla1995], [Poling5].
 */
export class EuckenThermalConductivity {
  static fromViscosity(Cp_J_molK: number, mu_Pa_s: number, M_kg_mol: number): number {
    return (Cp_J_molK + EUCKEN_FACTOR * PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK)
      * mu_Pa_s / M_kg_mol;
  }

  /**
   * Modified Eucken with internal-energy factor Z (Svehla).
   * When Z is omitted, falls back to classical Eucken.
   */
  static modifiedFromViscosity(
    Cp_J_molK: number,
    mu_Pa_s: number,
    M_kg_mol: number,
    Z?: number,
  ): number {
    if (Z === undefined) {
      return EuckenThermalConductivity.fromViscosity(Cp_J_molK, mu_Pa_s, M_kg_mol);
    }
    const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;
    const cvTr = 1.5 * R;
    const fTr = 2.5;
    const cvInt = Math.max(0, Cp_J_molK - 2.5 * R);
    return (mu_Pa_s / M_kg_mol) * (fTr * cvTr + Z * cvInt);
  }
}
