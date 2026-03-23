import { DimensionlessInputDto } from '../../dto/dimensionless.dto';
import { FlowGeometry } from '../../enums/flow-geometry.enum';
import { zukauskasCoeffs } from '../nu-coefficients.helper';

/**
 * Nu correlations for tube banks (inline and staggered).
 * All equations taken directly from cited sources.
 */
export const tubeBankNu = {

  /**
   * Zukauskas (1972) — tube bank, range-table form
   * Nu = C1·C2·Re_max^m·Pr^0.36·(Pr/Pr_s)^0.25
   * Source: Zukauskas A. (1972) Adv.Heat Transfer 8:93; [I7 §7.5]
   * Range: Re [10–2×10⁶], Pr [0.7–500]
   */
  zukauskas(re: number, pr: number, params: DimensionlessInputDto, D: number): number {
    const ST = params.dims?.S_T ?? 0.03;
    const SL = params.dims?.S_L ?? 0.03;
    const isStaggered = params.geometry === FlowGeometry.TUBE_BANK_STAGGERED;
    const V_max = (params.w_m_s ?? 1) * ST / (ST - D);
    const Re_max = params.rho_kg_m3 !== undefined
      ? params.rho_kg_m3 * V_max * D / (params.mu_Pa_s ?? 1e-5)
      : re;
    const [C1, m] = zukauskasCoeffs(Re_max, isStaggered, ST, SL);
    return C1 * Math.pow(Re_max, m) * Math.pow(pr, 0.36);
  },

  /**
   * Whitaker (1972) — tube bank with viscosity correction
   * Inline:    Nu = 0.4·Re_max^0.6·Pr^0.36·(μ/μ_s)^0.14
   * Staggered: Nu = 0.35·(S_T/S_L)^0.2·Re_max^0.6·Pr^0.36·(μ/μ_s)^0.14
   * Source: Whitaker S. (1972) AIChE J. 18:361, Eq.(12)
   * Range: Re [10³–2×10⁵], Pr [0.7–500]
   */
  whitaker(re: number, pr: number, mu: number, mu_s: number, params: DimensionlessInputDto): number {
    const ST = params.dims?.S_T ?? 0.03;
    const SL = params.dims?.S_L ?? 0.03;
    const isStaggered = params.geometry === FlowGeometry.TUBE_BANK_STAGGERED;
    const C = isStaggered ? 0.35 * Math.pow(ST / SL, 0.2) : 0.4;
    return C * Math.pow(re, 0.6) * Math.pow(pr, 0.36) * Math.pow(mu / mu_s, 0.14);
  },

  // ── Dispatcher ─────────────────────────────────────────────────────────
  compute(corr: string, re: number, pr: number, mu: number, mu_s: number,
          params: DimensionlessInputDto, D: number): number {
    switch (corr) {
      case 'zukauskas':        return tubeBankNu.zukauskas(re, pr, params, D);
      case 'whitaker_tube_bank': return tubeBankNu.whitaker(re, pr, mu, mu_s, params);
      default: throw new Error(`Unknown tube-bank correlation: ${corr}`);
    }
  },
};

