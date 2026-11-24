import { IDEAL_GAS_DENSITY_LIMITS } from '../../constants/ideal-gas-density-limits.constants';
import { PENG_ROBINSON } from '../../constants/peng-robinson.constants';
import { PHYSICAL_CONSTANTS } from '../../../../common/thermal/constants/physical.constants';
import { PengRobinsonFluidParams } from '../../types/peng-robinson-fluid-params.type';
import { brentq } from '../../../../common/utils/root-finding/brentq.util';

/**
 * Peng–Robinson (1976) mass density for pure fluids and mixtures (k_ij = 0).
 * Gas-phase root of the compressibility cubic. Refs: [Poling5].
 */
export class PengRobinson {
  /** True when T_c, P_c, ω are all present and positive. */
  static hasParams(params: {
    criticalTemperature?: number;
    criticalPressure?: number;
    acentricFactor?: number;
  }): boolean {
    const Tc = params.criticalTemperature;
    const Pc = params.criticalPressure;
    const w = params.acentricFactor;
    return Tc !== undefined && Tc > 0
      && Pc !== undefined && Pc > 0
      && w !== undefined;
  }

  /** Pure-fluid mass density [kg/m³]. */
  static pureMassDensity(
    params: PengRobinsonFluidParams,
    T_K: number,
    P_Pa: number,
  ): number {
    const { A, B } = PengRobinson.abDimensionless(params, T_K, P_Pa);
    const Z = PengRobinson.gasCompressibility(A, B);
    const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;
    const rhoMolar = P_Pa / (Z * R * T_K);
    return rhoMolar * params.Mr;
  }

  /**
   * Mixture mass density [kg/m³] with classical mixing (k_ij = 0):
   * a_m = ΣΣ y_i y_j √(a_i a_j), b_m = Σ y_i b_i.
   */
  static mixtureMassDensity(
    fluids: readonly PengRobinsonFluidParams[],
    moleFractions: readonly number[],
    T_K: number,
    P_Pa: number,
  ): number {
    if (fluids.length !== moleFractions.length) {
      throw new Error('Peng–Robinson mixture: fluids and mole fractions length mismatch');
    }
    const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;
    const a: number[] = [];
    const b: number[] = [];
    let M = 0;
    for (let i = 0; i < fluids.length; i++) {
      const yi = moleFractions[i];
      M += yi * fluids[i].Mr;
      const { aAlpha, bVol } = PengRobinson.abDimensional(fluids[i], T_K);
      a.push(aAlpha);
      b.push(bVol);
    }
    let am = 0;
    let bm = 0;
    for (let i = 0; i < fluids.length; i++) {
      bm += moleFractions[i] * b[i];
      for (let j = 0; j < fluids.length; j++) {
        am += moleFractions[i] * moleFractions[j] * Math.sqrt(a[i] * a[j]);
      }
    }
    const A = am * P_Pa / (R * R * T_K * T_K);
    const B = bm * P_Pa / (R * T_K);
    const Z = PengRobinson.gasCompressibility(A, B);
    return (P_Pa / (Z * R * T_K)) * M;
  }

  /**
   * Ideal-gas density is only valid inside IDEAL_GAS_DENSITY_LIMITS.
   * Throws when Pr or absolute P is too high (large |Z−1| expected).
   */
  static assertIdealGasAllowed(
    P_Pa: number,
    criticalPressure_Pa?: number,
  ): void {
    if (criticalPressure_Pa !== undefined && criticalPressure_Pa > 0) {
      const Pr = P_Pa / criticalPressure_Pa;
      if (Pr > IDEAL_GAS_DENSITY_LIMITS.MAX_REDUCED_PRESSURE) {
        throw new Error(
          `Ideal-gas density refused: P/P_c=${Pr.toFixed(3)} exceeds `
          + `${IDEAL_GAS_DENSITY_LIMITS.MAX_REDUCED_PRESSURE} `
          + `(need CoolProp Helmholtz or Peng–Robinson)`,
        );
      }
      return;
    }
    if (P_Pa > IDEAL_GAS_DENSITY_LIMITS.MAX_P_PA_WITHOUT_PC) {
      throw new Error(
        `Ideal-gas density refused: P=${P_Pa} Pa exceeds `
        + `${IDEAL_GAS_DENSITY_LIMITS.MAX_P_PA_WITHOUT_PC} Pa without P_c `
        + `(need CoolProp Helmholtz or Peng–Robinson)`,
      );
    }
  }

  private static abDimensional(
    params: PengRobinsonFluidParams,
    T_K: number,
  ): { aAlpha: number; bVol: number } {
    const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;
    const Tr = T_K / params.Tc;
    if (Tr <= 0) throw new Error('Peng–Robinson: T and T_c must be positive');
    const kappa = PENG_ROBINSON.KAPPA_0
      + PENG_ROBINSON.KAPPA_1 * params.omega
      - PENG_ROBINSON.KAPPA_2 * params.omega * params.omega;
    const alpha = (1 + kappa * (1 - Math.sqrt(Tr))) ** 2;
    const aAlpha = PENG_ROBINSON.OMEGA_A * R * R * params.Tc * params.Tc / params.Pc * alpha;
    const bVol = PENG_ROBINSON.OMEGA_B * R * params.Tc / params.Pc;
    return { aAlpha, bVol };
  }

  private static abDimensionless(
    params: PengRobinsonFluidParams,
    T_K: number,
    P_Pa: number,
  ): { A: number; B: number } {
    const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK;
    const { aAlpha, bVol } = PengRobinson.abDimensional(params, T_K);
    return {
      A: aAlpha * P_Pa / (R * R * T_K * T_K),
      B: bVol * P_Pa / (R * T_K),
    };
  }

  /**
   * Largest real root of Z³ − (1−B)Z² + (A−3B²−2B)Z − (AB−B²−B³) = 0
   * (vapor / gas branch).
   */
  private static gasCompressibility(A: number, B: number): number {
    const f = (Z: number): number => (
      Z * Z * Z
      - (1 - B) * Z * Z
      + (A - 3 * B * B - 2 * B) * Z
      - (A * B - B * B - B * B * B)
    );
    let lo = B + PENG_ROBINSON.Z_BRACKET_EPS;
    let hi = Math.max(PENG_ROBINSON.Z_BRACKET_HIGH, B + 1);
    let flo = f(lo);
    let fhi = f(hi);
    for (let i = 0; i < PENG_ROBINSON.Z_BRACKET_EXPAND_MAX && flo * fhi > 0; i++) {
      hi *= 1.5;
      fhi = f(hi);
    }
    if (flo * fhi > 0) {
      throw new Error('Peng–Robinson: no gas compressibility bracket');
    }
    return brentq(f, lo, hi, PENG_ROBINSON.BRENTQ_TOL_Z).root;
  }
}
