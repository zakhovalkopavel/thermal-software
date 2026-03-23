/**
 * Nu correlations for external flat plate flow.
 * All equations taken directly from cited sources.
 */
export const flatPlateNu = {

  /**
   * Laminar boundary layer — average Nu over plate length L
   * Nu_L = 0.664·Re_L^0.5·Pr^(1/3)
   * Source: [I7 §7.2] Incropera et al.; Pohlhausen (1921)
   * Range: Re_L < 5×10⁵
   */
  laminar(re: number, pr: number): number {
    return 0.664 * Math.pow(re, 0.5) * Math.pow(pr, 1/3);
  },

  /**
   * Fully turbulent boundary layer
   * Nu_L = 0.037·Re_L^0.8·Pr^(1/3)
   * Source: [I7 §7.2]; Re_L > 5×10⁵
   */
  turbulent(re: number, pr: number): number {
    return 0.037 * Math.pow(re, 0.8) * Math.pow(pr, 1/3);
  },

  /**
   * Mixed laminar+turbulent — accounts for laminar leading section
   * Nu_L = (0.037·Re^0.8 − 871)·Pr^(1/3)   (Re_cr = 5×10⁵)
   * Source: [I7 §7.2]
   */
  mixed(re: number, pr: number): number {
    return (0.037 * Math.pow(re, 0.8) - 871) * Math.pow(pr, 1/3);
  },

  /**
   * Churchill & Ozoe (1973) — laminar, valid for all Pr
   * Nu_L = 0.6774·Re_L^0.5·Pr^(1/3) / [1+(0.0468/Pr)^(2/3)]^(1/4)
   * Source: Churchill S.W., Ozoe H. (1973) J.Heat Transfer 95:78, Eq.(1)
   * Range: Re_L < 5×10⁵
   */
  churchillOzoe(re: number, pr: number): number {
    return 0.6774 * Math.pow(re, 0.5) * Math.pow(pr, 1/3) /
      Math.pow(1 + Math.pow(0.0468 / pr, 2/3), 0.25);
  },

  /**
   * Whitaker (1972) — flat plate with viscosity correction
   * Nu = (0.4·Re^0.5 + 0.06·Re^(2/3))·Pr^0.4·(μ/μ_s)^0.25
   * Source: Whitaker S. (1972) AIChE J. 18:361, Eq.(5)
   * Range: Re [4×10⁴–3×10⁵], Pr [0.7–400]
   */
  whitaker(re: number, pr: number, mu: number, mu_s: number): number {
    return (0.4 * Math.pow(re, 0.5) + 0.06 * Math.pow(re, 2/3))
      * Math.pow(pr, 0.4) * Math.pow(mu / mu_s, 0.25);
  },

  // ── Dispatcher ─────────────────────────────────────────────────────────
  compute(corr: string, re: number, pr: number, mu: number, mu_s: number): number {
    switch (corr) {
      case 'flat_plate_laminar':  return flatPlateNu.laminar(re, pr);
      case 'flat_plate_turbulent':return flatPlateNu.turbulent(re, pr);
      case 'flat_plate_mixed':    return flatPlateNu.mixed(re, pr);
      case 'churchill_ozoe':      return flatPlateNu.churchillOzoe(re, pr);
      case 'whitaker_flat_plate': return flatPlateNu.whitaker(re, pr, mu, mu_s);
      default: throw new Error(`Unknown flat-plate correlation: ${corr}`);
    }
  },
};

