/**
 * Nu correlations for external flow over spheres.
 * All equations taken directly from cited sources.
 */
export const sphereNu = {

  /**
   * Ranz & Marshall (1952) — forced convection from sphere
   * Nu = 2 + 0.4·Re^0.5·Pr^(1/3)
   * Source: [Leg 841]; Ranz W.E., Marshall W.R. (1952) Chem.Eng.Prog. 48:141
   */
  ranzMarshall(re: number, pr: number): number {
    return 2 + 0.4 * Math.pow(re, 0.5) * Math.pow(pr, 1/3);
  },

  /**
   * Diffusion-limited mass transfer from sphere (Russian literature)
   * Nu = 2 + 0.17·Re^(2/3)
   * Source: [Leg 839]
   */
  diffusion(re: number): number {
    return 2 + 0.17 * Math.pow(re, 2/3);
  },

  /**
   * Whitaker (1972) — sphere with viscosity correction, most accurate
   * Nu = 2 + (0.4·Re^0.5 + 0.06·Re^(2/3))·Pr^0.4·(μ/μ_s)^0.25
   * Source: Whitaker S. (1972) AIChE J. 18:361, Eq.(9)
   * Range: Re [3.5–7.6×10⁴], Pr [0.71–380]
   */
  whitaker(re: number, pr: number, mu: number, mu_s: number): number {
    return 2 + (0.4 * Math.pow(re, 0.5) + 0.06 * Math.pow(re, 2/3))
      * Math.pow(pr, 0.4) * Math.pow(mu / mu_s, 0.25);
  },

  // ── Dispatcher ─────────────────────────────────────────────────────────
  compute(corr: string, re: number, pr: number, mu: number, mu_s: number): number {
    switch (corr) {
      case 'sphere_ranz_marshall': return sphereNu.ranzMarshall(re, pr);
      case 'sphere_diffusion':     return sphereNu.diffusion(re);
      case 'whitaker_sphere':      return sphereNu.whitaker(re, pr, mu, mu_s);
      default: throw new Error(`Unknown sphere correlation: ${corr}`);
    }
  },
};

