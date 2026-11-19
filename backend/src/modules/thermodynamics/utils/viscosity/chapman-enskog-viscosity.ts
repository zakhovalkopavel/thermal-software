import { PHYSICAL_CONSTANTS } from '../../../../common/thermal/constants/physical.constants';
import { CompoundValue } from '../../../../common/thermal/interfaces/compound-value.interface';
import { CHAPMAN_ENSKOG } from '../../constants/chapman-enskog.constants';
import { CHUNG_THERMAL_CONDUCTIVITY } from '../../constants/chung-thermal-conductivity.constants';
import { NeufeldCollisionIntegrals } from '../chapman-enskog/neufeld-collision-integrals';

/**
 * Dilute-gas pure viscosity via Chapman–Enskog (LJ or Stockmayer).
 * Refs: [Poling5] §9-3; Stockmayer correction [Itean1961], [Svehla1995].
 */
export class ChapmanEnskogViscosity {
  /**
   * μ [Pa·s] and method label from compound LJ / Stockmayer fields.
   */
  static fromCompound(
    compound: CompoundValue,
    T_K: number,
  ): { value: number; polar: boolean; message: string } {
    if (compound.collisionDiameter === undefined || compound.epsilonToKb === undefined) {
      throw new Error(
        `No viscosity correlation and no Lennard-Jones parameters for ${compound.chemicalFormula}`,
      );
    }
    const delta = ChapmanEnskogViscosity.resolveDelta(
      compound.stockmayerDelta,
      compound.dipoleMoment,
      compound.collisionDiameter,
      compound.epsilonToKb,
    );
    const polar = ChapmanEnskogViscosity.isPolar(
      compound.stockmayerDelta,
      compound.dipoleMoment,
    );
    const value = ChapmanEnskogViscosity.viscosity(
      compound.Mr,
      T_K,
      compound.collisionDiameter,
      compound.epsilonToKb,
      delta,
    );
    return {
      value,
      polar,
      message: polar
        ? 'Chapman–Enskog Stockmayer viscosity (Neufeld Ω_v + δ correction).'
        : 'Chapman–Enskog Lennard-Jones viscosity (Neufeld Ω_v).',
    };
  }

  /**
   * μ [Pa·s] for a pure gas.
   * @param M_kg_mol molar mass [kg/mol]
   * @param sigma_A collision diameter [Å]
   * @param epsilonToKb ε/k [K]
   * @param stockmayerDelta Stockmayer δ [-]; omit / 0 → LJ
   */
  static viscosity(
    M_kg_mol: number,
    T_K: number,
    sigma_A: number,
    epsilonToKb: number,
    stockmayerDelta: number = 0,
  ): number {
    const Tstar = T_K / epsilonToKb;
    let omega = NeufeldCollisionIntegrals.omegaV(Tstar);
    if (stockmayerDelta > 0) {
      omega += CHAPMAN_ENSKOG.STOCKMAYER_OMEGA_V_COEFF
        * stockmayerDelta * stockmayerDelta / Tstar;
    }
    const M_g = M_kg_mol * CHAPMAN_ENSKOG.KG_MOL_TO_G_MOL;
    const mu_microP = CHAPMAN_ENSKOG.MU_PREFACTOR_MICROP
      * Math.sqrt(M_g * T_K)
      / (sigma_A * sigma_A * omega);
    return mu_microP * CHAPMAN_ENSKOG.MU_MICROP_TO_PA_S;
  }

  /**
   * True when CE should use the Stockmayer branch (δ or significant dipole).
   * @param dipole_C_m SI dipole [C·m], optional
   */
  static isPolar(stockmayerDelta: number | undefined, dipole_C_m: number | undefined): boolean {
    if (stockmayerDelta !== undefined && stockmayerDelta > 0) return true;
    if (dipole_C_m === undefined) return false;
    const debye = dipole_C_m / CHUNG_THERMAL_CONDUCTIVITY.COULOMB_METRE_PER_DEBYE;
    return Math.abs(debye) >= CHAPMAN_ENSKOG.POLAR_DIPOLE_DEBYE_MIN;
  }

  /**
   * δ for CE: prefer stored stockmayerDelta; else δ = μ²/(2εσ³) in SI
   * (ε = k_B·(ε/k), σ from Å).
   */
  static resolveDelta(
    stockmayerDelta: number | undefined,
    dipole_C_m: number | undefined,
    sigma_A: number,
    epsilonToKb: number,
  ): number {
    if (stockmayerDelta !== undefined && stockmayerDelta > 0) return stockmayerDelta;
    if (dipole_C_m === undefined || !ChapmanEnskogViscosity.isPolar(undefined, dipole_C_m)) {
      return 0;
    }
    const sigma_m = sigma_A * 1e-10;
    const eps_J = PHYSICAL_CONSTANTS.BOLTZMANN_J_K * epsilonToKb;
    return (dipole_C_m * dipole_C_m) / (2 * eps_J * Math.pow(sigma_m, 3));
  }
}
