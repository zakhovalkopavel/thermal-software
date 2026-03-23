import { hilpertCoeffs } from '../nu-coefficients.helper';

/**
 * Nu correlations for external flow over cylinders and tube banks.
 * All equations taken directly from cited sources.
 */
export const cylinderNu = {

  /**
   * Churchill & Bernstein (1977) — all Re, single cylinder in crossflow
   * Nu = 0.3 + 0.62·Re^0.5·Pr^(1/3) / [1+(0.4/Pr)^(2/3)]^(1/4) · [1+(Re/282000)^(5/8)]^(4/5)
   * Source: Churchill S.W., Bernstein M. (1977) J.Heat Transfer 99:300, Eq.(1)
   * Range: Re [0–∞], Pe = Re·Pr ≥ 0.2
   */
  churchillBernstein(re: number, pr: number): number {
    const term1 = 0.62 * Math.pow(re, 0.5) * Math.pow(pr, 1/3)
      / Math.pow(1 + Math.pow(0.4 / pr, 2/3), 0.25);
    return 0.3 + term1 * Math.pow(1 + Math.pow(re / 282000, 5/8), 4/5);
  },

  /**
   * Hilpert (1933) — range-table form, single cylinder
   * Nu = C·Re^m·Pr^(1/3)
   * Source: Hilpert R. (1933) Forsch. Geb. Ingenieurwes. 4:215
   * Range: Re [0.4–4×10⁵]
   */
  hilpert(re: number, pr: number): number {
    const [C, m] = hilpertCoeffs(re);
    return C * Math.pow(re, m) * Math.pow(pr, 1/3);
  },

  /**
   * Whitaker (1972) — cylinder with viscosity correction
   * Nu = (0.4·Re^0.5 + 0.06·Re^(2/3))·Pr^0.4·(μ/μ_s)^0.25
   * Source: Whitaker S. (1972) AIChE J. 18:361, Eq.(7)
   * Range: Re [10–1.5×10⁵], Pr [0.65–300]
   */
  whitaker(re: number, pr: number, mu: number, mu_s: number): number {
    return (0.4 * Math.pow(re, 0.5) + 0.06 * Math.pow(re, 2/3))
      * Math.pow(pr, 0.4) * Math.pow(mu / mu_s, 0.25);
  },

  // ── Dispatcher ─────────────────────────────────────────────────────────
  compute(corr: string, re: number, pr: number, mu: number, mu_s: number): number {
    switch (corr) {
      case 'churchill_bernstein': return cylinderNu.churchillBernstein(re, pr);
      case 'hilpert':             return cylinderNu.hilpert(re, pr);
      case 'whitaker_cylinder':   return cylinderNu.whitaker(re, pr, mu, mu_s);
      default: throw new Error(`Unknown cylinder correlation: ${corr}`);
    }
  },
};

