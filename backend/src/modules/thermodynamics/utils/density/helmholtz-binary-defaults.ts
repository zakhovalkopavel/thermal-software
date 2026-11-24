import { HELMHOLTZ_BINARY_DEFAULTS } from '../../constants/helmholtz-binary-defaults.constants';
import { CoolpropHelmholtzData } from './coolprop-helmholtz-data';
import { HelmholtzBinaryBetas } from '../../types/helmholtz-binary-betas.type';

/**
 * Resolve CoolProp binary β/γ/F, or estimate when the pair row is missing.
 * Rule 1: Lorentz–Berthelot (β=γ=1, F=0).
 * Rule 2: arithmetic γ_T for asymmetric Tc / quantum fluids.
 */
export class HelmholtzBinaryDefaults {
  /**
   * Oriented parameters for ordered (keyI, keyJ) with critical temperatures TcI, TcJ.
   */
  static forPair(
    keyI: string,
    keyJ: string,
    TcI: number,
    TcJ: number,
  ): HelmholtzBinaryBetas {
    const pair = CoolpropHelmholtzData.findPair(keyI, keyJ);
    if (pair && pair.betaT !== undefined) {
      const forward = pair.Name1 === keyI && pair.Name2 === keyJ;
      const betaT = pair.betaT;
      const betaV = pair.betaV ?? HELMHOLTZ_BINARY_DEFAULTS.BETA_V;
      return {
        betaT: forward ? betaT : 1 / betaT,
        gammaT: pair.gammaT ?? HELMHOLTZ_BINARY_DEFAULTS.GAMMA_T,
        betaV: forward ? betaV : 1 / betaV,
        gammaV: pair.gammaV ?? HELMHOLTZ_BINARY_DEFAULTS.GAMMA_V,
        F: pair.function ? (pair.F ?? 1) : HELMHOLTZ_BINARY_DEFAULTS.F,
      };
    }
    return HelmholtzBinaryDefaults.estimate(keyI, keyJ, TcI, TcJ);
  }

  /** Rule 1 or Rule 2 when no CoolProp binary row exists. */
  static estimate(
    keyI: string,
    keyJ: string,
    TcI: number,
    TcJ: number,
  ): HelmholtzBinaryBetas {
    const gammaT = HelmholtzBinaryDefaults.isAsymmetric(keyI, keyJ, TcI, TcJ)
      ? HelmholtzBinaryDefaults.arithmeticGammaT(TcI, TcJ)
      : HELMHOLTZ_BINARY_DEFAULTS.GAMMA_T;
    return {
      betaT: HELMHOLTZ_BINARY_DEFAULTS.BETA_T,
      gammaT,
      betaV: HELMHOLTZ_BINARY_DEFAULTS.BETA_V,
      gammaV: HELMHOLTZ_BINARY_DEFAULTS.GAMMA_V,
      F: HELMHOLTZ_BINARY_DEFAULTS.F,
    };
  }

  /** γ_T = (T_c,i + T_c,j) / (2 √(T_c,i T_c,j)) */
  static arithmeticGammaT(TcI: number, TcJ: number): number {
    return (TcI + TcJ) / (2 * Math.sqrt(TcI * TcJ));
  }

  private static isAsymmetric(
    keyI: string,
    keyJ: string,
    TcI: number,
    TcJ: number,
  ): boolean {
    const asymmetric = HELMHOLTZ_BINARY_DEFAULTS.ASYMMETRIC_FLUID_KEYS as readonly string[];
    if (asymmetric.includes(keyI) || asymmetric.includes(keyJ)) return true;
    const lo = Math.min(TcI, TcJ);
    if (lo <= 0) return false;
    return Math.max(TcI, TcJ) / lo >= HELMHOLTZ_BINARY_DEFAULTS.ASYMMETRIC_TC_RATIO;
  }
}
