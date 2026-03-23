import { DimensionlessInputDto } from '../../dto/dimensionless.dto';
import { FlowRegime } from '../../types/flow-regime.type';

/**
 * Nu correlations for internal pipe and duct flow.
 * All equations taken directly from cited sources.
 */
export const pipeDuctNu = {

  /**
   * Mills (1992) — laminar developing flow
   * Nu = 3.66 + (0.065·Re·Pr·D/L) / (1 + 0.4·(Re·Pr·D/L)^(2/3))
   * Source: [Leg 871]; Mills A.F. (1992) Heat Transfer, Irwin §8.4
   */
  mills(re: number, pr: number, D: number, L: number): number {
    if (D <= 0 || L <= 0) return 3.66;
    const x = 0.065 * re * pr * D / L;
    return 3.66 + x / (1 + 0.4 * Math.pow(re * pr * D / L, 2/3));
  },

  /**
   * Sieder & Tate (1936) — laminar with viscosity correction
   * Nu = 1.86·(Re·Pr·D/L)^(1/3)·(μ/μ_w)^0.14
   * Source: [Leg 877]; Sieder E.N., Tate G.E. (1936) Ind.Eng.Chem. 28:1429
   */
  siederTateLaminar(re: number, pr: number, D: number, L: number, mu: number, mu_s: number): number {
    if (D <= 0 || L <= 0) return 3.66;
    return 1.86 * Math.pow(re * pr * D / L, 1/3) * Math.pow(mu / mu_s, 0.14);
  },

  /** Fully developed laminar — uniform wall temperature (Graetz solution)
   * Nu = 3.66  Source: [I7 §8.4] Incropera et al.
   */
  fullyDevelopedUniformT(): number { return 3.66; },

  /** Fully developed laminar — uniform heat flux
   * Nu = 4.36  Source: [I7 §8.4] Incropera et al.
   */
  fullyDevelopedUniformQ(): number { return 4.36; },

  /**
   * Transitional regime (2300 < Re < 10000)
   * Nu = 0.008·Re^0.9·Pr^0.43
   * Source: [Leg 882]
   */
  transitional(re: number, pr: number): number {
    return 0.008 * Math.pow(re, 0.9) * Math.pow(pr, 0.43);
  },

  /**
   * Gnielinski (1976) — turbulent
   * f = (0.79·ln Re − 1.64)^−2
   * Nu = (f/8)·(Re−1000)·Pr / (1 + 12.7·√(f/8)·(Pr^(2/3)−1))
   * Source: [Leg 892]; Gnielinski V. (1976) Int.Chem.Eng. 16:359
   * Range: Re [3000–5×10⁶], Pr [0.5–2000]
   */
  gnielinski(re: number, pr: number): number {
    const f = Math.pow(0.79 * Math.log(re) - 1.64, -2);
    return (f/8) * (re - 1000) * pr / (1 + 12.7 * Math.sqrt(f/8) * (Math.pow(pr, 2/3) - 1));
  },

  /**
   * Gnielinski v2 — uses Churchill (1977) all-regime friction factor
   * Extends Gnielinski to full Re range including laminar
   * Source: Churchill S.W. (1977) Chem.Eng.Comm. 1:354
   */
  gnielinskiV2(re: number, pr: number): number {
    const A = Math.pow(2.457 * Math.log(1 / Math.pow(7/re, 0.9)), 16);
    const B = Math.pow(37530 / re, 16);
    const f = 8 * Math.pow(Math.pow(8/re, 12) + Math.pow(A + B, -1.5), 1/12);
    if (re < 3000) return 3.66;
    return (f/8) * (re - 1000) * pr / (1 + 12.7 * Math.sqrt(f/8) * (Math.pow(pr, 2/3) - 1));
  },

  /**
   * Dittus & Boelter (1930) — turbulent
   * Nu = 0.023·Re^0.8·Pr^n   n=0.4 heating, n=0.3 cooling
   * Source: [Leg 908]; [I7 §8.5]
   * Range: Re > 10⁴, Pr [0.6–160]
   */
  dittusBoelter(re: number, pr: number, isHeating: boolean): number {
    return 0.023 * Math.pow(re, 0.8) * Math.pow(pr, isHeating ? 0.4 : 0.3);
  },

  /**
   * Sieder & Tate (1936) — turbulent with viscosity correction
   * Nu = 0.027·Re^0.8·Pr^(1/3)·(μ/μ_w)^0.14
   * Source: [Leg 903]; [C5 §8-3]
   */
  siederTateTurbulent(re: number, pr: number, mu: number, mu_s: number): number {
    return 0.027 * Math.pow(re, 0.8) * Math.pow(pr, 1/3) * Math.pow(mu / mu_s, 0.14);
  },

  /**
   * Mikheev (1956) — turbulent (Russian standard)
   * Nu = 0.021·Re^0.8·Pr^0.43·(Pr/Pr_w)^0.25·ε_l   ε_l ≈ 1.2
   * Source: [Leg 918]; Mikheev M.A. (1956) Osnovy Teploperedachi
   */
  mikheev(re: number, pr: number): number {
    return 0.021 * Math.pow(re, 0.8) * Math.pow(pr, 0.43) * 1.2;
  },

  /**
   * Petukhov (1970) — turbulent, more accurate than Dittus-Boelter
   * Nu = (f/8)·Re·Pr / (1.07 + 12.7·√(f/8)·(Pr^(2/3)−1))
   * Source: [I7 §8.5]; [VDI G1]; Petukhov B.S. (1970) Adv.Heat Transfer 6:503
   * Range: Re [10⁴–5×10⁶], Pr [0.5–200]
   */
  petukhov(re: number, pr: number): number {
    const f = Math.pow(0.79 * Math.log(re) - 1.64, -2);
    return (f/8) * re * pr / (1.07 + 12.7 * Math.sqrt(f/8) * (Math.pow(pr, 2/3) - 1));
  },

  /**
   * Whitaker (1972) — pipe, with viscosity correction
   * Nu = 0.015·Re^0.83·Pr^(1/3)·(μ/μ_w)^0.14
   * Source: Whitaker S. (1972) AIChE J. 18:361, Eq.(1)
   * Range: Re [10⁴–5×10⁵], Pr [0.7–700]
   */
  whitakerPipe(re: number, pr: number, mu: number, mu_s: number): number {
    return 0.015 * Math.pow(re, 0.83) * Math.pow(pr, 1/3) * Math.pow(mu / mu_s, 0.14);
  },

  /**
   * Seban & McLaughlin (1963) — helical coil
   * Laminar:   Nu = 0.036·Re^0.5·Pr^0.43·(D/D_c)^0.1
   * Turbulent: Nu_straight·(1 + 3.6·(1−D/D_c)·(D/D_c)^0.8)   with Dittus-Boelter base
   * Source: Seban R.A., McLaughlin E.F. (1963) Int.J.Heat Mass Transfer 6:387; [VDI L1.3]
   */
  sebanMcLaughlin(re: number, pr: number, D: number, D_c: number, regime: FlowRegime): number {
    const ratio = D / D_c;
    if (regime === FlowRegime.LAMINAR)
      return 0.036 * Math.pow(re, 0.5) * Math.pow(pr, 0.43) * Math.pow(ratio, 0.1);
    return 0.023 * Math.pow(re, 0.8) * Math.pow(pr, 0.4) * (1 + 3.6 * (1 - ratio) * Math.pow(ratio, 0.8));
  },

  /**
   * Webb, Eckert & Goldstein (1971) — corrugated/ribbed channel
   * St·Pr^(2/3) = (f/2) using rough-pipe Blasius modifier
   * Source: Webb R.L., Eckert E.R.G., Goldstein R.J. (1971) Int.J.Heat Mass Transfer 14:601; [VDI G8]
   */
  webbEckertGoldstein(re: number, pr: number, e: number, D: number): number {
    const e_D = e / D;
    const f_rough = 0.316 * Math.pow(re, -0.25) * (1 + 1.77 * e_D);
    return (f_rough / 2) * re * Math.pow(pr, 1/3);
  },

  /**
   * Isachenko roughness correction — turbulent rough pipe
   * Nu = 0.023·Re^0.8·Pr^0.4·(1 + 1.77·e/D)
   * Source: Isachenko V.P. et al. (1981) Heat Transfer, Mir
   */
  isachenkoRoughness(re: number, pr: number, e: number, D: number): number {
    return 0.023 * Math.pow(re, 0.8) * Math.pow(pr, 0.4) * (1 + 1.77 * e / D);
  },

  // ── Dispatcher ─────────────────────────────────────────────────────────
  compute(corr: string, params: DimensionlessInputDto, re: number, pr: number, regime: FlowRegime): number {
    const dims  = params.dims ?? {};
    const D     = (dims.a ?? 0.05) * 2;
    const L     = dims.c ?? 1;
    const mu    = params.mu_Pa_s ?? 1e-5;
    const mu_s  = params.mu_s_Pa_s ?? mu;
    switch (corr) {
      case 'mills':                     return pipeDuctNu.mills(re, pr, D, L);
      case 'sieder_tate_laminar':       return pipeDuctNu.siederTateLaminar(re, pr, D, L, mu, mu_s);
      case 'fully_developed_uniform_T': return pipeDuctNu.fullyDevelopedUniformT();
      case 'fully_developed_uniform_q': return pipeDuctNu.fullyDevelopedUniformQ();
      case 'transitional':              return pipeDuctNu.transitional(re, pr);
      case 'gnielinski':                return pipeDuctNu.gnielinski(re, pr);
      case 'gnielinski_v2':             return pipeDuctNu.gnielinskiV2(re, pr);
      case 'dittus_boelter':            return pipeDuctNu.dittusBoelter(re, pr, params.isHeating !== false);
      case 'sieder_tate_turbulent':     return pipeDuctNu.siederTateTurbulent(re, pr, mu, mu_s);
      case 'mikheev':                   return pipeDuctNu.mikheev(re, pr);
      case 'petukhov':                  return pipeDuctNu.petukhov(re, pr);
      case 'whitaker_pipe':             return pipeDuctNu.whitakerPipe(re, pr, mu, mu_s);
      case 'seban_mclaughlin':          return pipeDuctNu.sebanMcLaughlin(re, pr, D, dims.D_c ?? 0.5, regime);
      case 'webb_eckert_goldstein':     return pipeDuctNu.webbEckertGoldstein(re, pr, dims.e ?? 0.001, D);
      case 'isachenko_roughness':       return pipeDuctNu.isachenkoRoughness(re, pr, dims.e ?? 0.001, D);
      default: throw new Error(`Unknown pipe/duct correlation: ${corr}`);
    }
  },
};

