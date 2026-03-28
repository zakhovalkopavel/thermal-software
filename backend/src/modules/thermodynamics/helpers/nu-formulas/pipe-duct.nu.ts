import { FlowRegime } from '../../types/flow-regime.type';
import { GeometryDimsDto } from '../../dto/geometry-dims.dto';

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
  mills(Re: number, Pr: number, D: number, L: number): number {
    if (D <= 0 || L <= 0) return 3.66;
    const x = 0.065 * Re * Pr * D / L;
    return 3.66 + x / (1 + 0.4 * Math.pow(Re * Pr * D / L, 2/3));
  },

  /**
   * Sieder & Tate (1936) — laminar with viscosity correction
   * Nu = 1.86·(Re·Pr·D/L)^(1/3)·(μ/μ_w)^0.14
   * Source: [Leg 877]; Sieder E.N., Tate G.E. (1936) Ind.Eng.Chem. 28:1429
   */
  siederTateLaminar(Re: number, Pr: number, D: number, L: number, mu: number, mu_s: number): number {
    if (D <= 0 || L <= 0) return 3.66;
    return 1.86 * Math.pow(Re * Pr * D / L, 1/3) * Math.pow(mu / mu_s, 0.14);
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
  transitional(Re: number, Pr: number): number {
    return 0.008 * Math.pow(Re, 0.9) * Math.pow(Pr, 0.43);
  },

  /**
   * Gnielinski (1976) — turbulent
   * f = (0.79·ln Re − 1.64)^−2
   * Nu = (f/8)·(Re−1000)·Pr / (1 + 12.7·√(f/8)·(Pr^(2/3)−1))
   * Source: [Leg 892]; Gnielinski V. (1976) Int.Chem.Eng. 16:359
   * Range: Re [3000–5×10⁶], Pr [0.5–2000]
   */
  gnielinski(Re: number, Pr: number): number {
    const f = Math.pow(0.79 * Math.log(Re) - 1.64, -2);
    return (f/8) * (Re - 1000) * Pr / (1 + 12.7 * Math.sqrt(f/8) * (Math.pow(Pr, 2/3) - 1));
  },

  /**
   * Gnielinski v2 — uses Churchill (1977) all-regime friction factor
   * Extends Gnielinski to full Re range including laminar
   * Source: Churchill S.W. (1977) Chem.Eng.Comm. 1:354
   */
  gnielinskiV2(Re: number, Pr: number): number {
    const A = Math.pow(2.457 * Math.log(1 / Math.pow(7/Re, 0.9)), 16);
    const B = Math.pow(37530 / Re, 16);
    const f = 8 * Math.pow(Math.pow(8/Re, 12) + Math.pow(A + B, -1.5), 1/12);
    if (Re < 3000) return 3.66;
    return (f/8) * (Re - 1000) * Pr / (1 + 12.7 * Math.sqrt(f/8) * (Math.pow(Pr, 2/3) - 1));
  },

  /**
   * Dittus & Boelter (1930) — turbulent
   * Nu = 0.023·Re^0.8·Pr^n   n=0.4 heating, n=0.3 cooling
   * Source: [Leg 908]; [I7 §8.5]
   * Range: Re > 10⁴, Pr [0.6–160]
   */
  dittusBoelter(Re: number, Pr: number, isHeating: boolean): number {
    return 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, isHeating ? 0.4 : 0.3);
  },

  /**
   * Sieder & Tate (1936) — turbulent with viscosity correction
   * Nu = 0.027·Re^0.8·Pr^(1/3)·(μ/μ_w)^0.14
   * Source: [Leg 903]; [C5 §8-3]
   */
  siederTateTurbulent(Re: number, Pr: number, mu: number, mu_s: number): number {
    return 0.027 * Math.pow(Re, 0.8) * Math.pow(Pr, 1/3) * Math.pow(mu / mu_s, 0.14);
  },

  /**
   * Calculates the epsilon_l approximation for given Re and L/D.
   * Valid for Re: 10,000 - 1,000,000 and L/D: 1 - 50.
   */
  calculateEpsilon(Re: number, L_d: number): number {
    const a = 4.45630644;
    const b = -0.66010006;
    const c = -0.28544799;
    const d = 0.01096169;
    const e = -0.12998219;
    const f = 0.01390912;

    const x = Math.log(Re);
    const y = Math.log(L_d);

    const exponent = a + (b * x) + (c * y) + (d * x * y) + (e * y * y) + (f * x * x);

    return 1 + Math.exp(exponent);
  },

  /**
   * Mikheev (1956) — turbulent (Russian standard)
   * Nu = 0.021·Re^0.8·Pr^0.43·(Pr/Pr_w)^0.25·ε_l
   *
   * ε_l = f(Re, L/d) — entry-length correction factor from Mikheev Table 7-1.
   *        Interpolated via bilinear interpolation in log(Re) × L/d space.
   *        = 1.0 for fully-developed flow (L/d ≥ 50).
   *
   * Source: [Leg 918]; Mikheev M.A. (1956) Osnovy Teploperedachi
   * Range: Re > 10⁴, L/d > 1
   *
   * @param Re    Reynolds number
   * @param Pr    Prandtl number at bulk temperature
   * @param L_d   L/d ratio (pipe length / inner diameter); defaults to 50 (fully developed)
   * @param pr_w  Prandtl number at wall temperature; defaults to Pr (correction = 1)
   */
  mikheev(Re: number, Pr: number, L_d = 50, pr_w = Pr): number {
    const epsilon_l = this.calculateEpsilon(Re, L_d);
    const k = Pr<=2 ? 0.021: 0.023;
    return k * Math.pow(Re, 0.8) * Math.pow(Pr, 0.43) * Math.pow(Pr / pr_w, 0.25) * epsilon_l;
  },

  /**
   * Petukhov (1970) — turbulent, more accurate than Dittus-Boelter
   * Nu = (f/8)·Re·Pr / (1.07 + 12.7·√(f/8)·(Pr^(2/3)−1))
   * Source: [I7 §8.5]; [VDI G1]; Petukhov B.S. (1970) Adv.Heat Transfer 6:503
   * Range: Re [10⁴–5×10⁶], Pr [0.5–200]
   */
  petukhov(Re: number, Pr: number): number {
    const f = Math.pow(0.79 * Math.log(Re) - 1.64, -2);
    return (f/8) * Re * Pr / (1.07 + 12.7 * Math.sqrt(f/8) * (Math.pow(Pr, 2/3) - 1));
  },

  /**
   * Whitaker (1972) — pipe, with viscosity correction
   * Nu = 0.015·Re^0.83·Pr^(1/3)·(μ/μ_w)^0.14
   * Source: Whitaker S. (1972) AIChE J. 18:361, Eq.(1)
   * Range: Re [10⁴–5×10⁵], Pr [0.7–700]
   */
  whitakerPipe(Re: number, Pr: number, mu: number, mu_s: number): number {
    return 0.015 * Math.pow(Re, 0.83) * Math.pow(Pr, 1/3) * Math.pow(mu / mu_s, 0.14);
  },

  /**
   * Seban & McLaughlin (1963) — helical coil
   * Laminar:   Nu = 0.036·Re^0.5·Pr^0.43·(D/D_c)^0.1
   * Turbulent: Nu_straight·(1 + 3.6·(1−D/D_c)·(D/D_c)^0.8)   with Dittus-Boelter base
   * Source: Seban R.A., McLaughlin E.F. (1963) Int.J.Heat Mass Transfer 6:387; [VDI L1.3]
   */
  sebanMcLaughlin(Re: number, Pr: number, D: number, D_c: number, regime: FlowRegime): number {
    const ratio = D / D_c;
    if (regime === FlowRegime.LAMINAR)
      return 0.036 * Math.pow(Re, 0.5) * Math.pow(Pr, 0.43) * Math.pow(ratio, 0.1);
    return 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, 0.4) * (1 + 3.6 * (1 - ratio) * Math.pow(ratio, 0.8));
  },

  /**
   * Webb, Eckert & Goldstein (1971) — corrugated/ribbed channel
   * St·Pr^(2/3) = (f/2) using rough-pipe Blasius modifier
   * Source: Webb R.L., Eckert E.R.G., Goldstein R.J. (1971) Int.J.Heat Mass Transfer 14:601; [VDI G8]
   */
  webbEckertGoldstein(Re: number, Pr: number, e: number, D: number): number {
    const e_D = e / D;
    const f_rough = 0.316 * Math.pow(Re, -0.25) * (1 + 1.77 * e_D);
    return (f_rough / 2) * Re * Math.pow(Pr, 1/3);
  },

  /**
   * Isachenko roughness correction — turbulent rough pipe
   * Nu = 0.023·Re^0.8·Pr^0.4·(1 + 1.77·e/D)
   * Source: Isachenko V.P. et al. (1981) Heat Transfer, Mir
   */
  isachenkoRoughness(Re: number, Pr: number, e: number, D: number): number {
    return 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, 0.4) * (1 + 1.77 * e / D);
  },

  // ── Dispatcher ─────────────────────────────────────────────────────────
  compute(corr: string, dims: GeometryDimsDto, mu: number, mu_s: number, isHeating: boolean, Re: number, Pr: number, regime: FlowRegime, pr_w = Pr): number {
    const D   = (dims.a ?? 0.05) * 2;
    const L   = dims.c ?? 1;
    const L_d = D > 0 ? L / D : 50;
    switch (corr) {
      case 'mills':                     return pipeDuctNu.mills(Re, Pr, D, L);
      case 'sieder_tate_laminar':       return pipeDuctNu.siederTateLaminar(Re, Pr, D, L, mu, mu_s);
      case 'fully_developed_uniform_T': return pipeDuctNu.fullyDevelopedUniformT();
      case 'fully_developed_uniform_q': return pipeDuctNu.fullyDevelopedUniformQ();
      case 'transitional':              return pipeDuctNu.transitional(Re, Pr);
      case 'gnielinski':                return pipeDuctNu.gnielinski(Re, Pr);
      case 'gnielinski_v2':             return pipeDuctNu.gnielinskiV2(Re, Pr);
      case 'dittus_boelter':            return pipeDuctNu.dittusBoelter(Re, Pr, isHeating);
      case 'sieder_tate_turbulent':     return pipeDuctNu.siederTateTurbulent(Re, Pr, mu, mu_s);
      case 'mikheev':                   return pipeDuctNu.mikheev(Re, Pr, L_d, pr_w);
      case 'petukhov':                  return pipeDuctNu.petukhov(Re, Pr);
      case 'whitaker_pipe':             return pipeDuctNu.whitakerPipe(Re, Pr, mu, mu_s);
      case 'seban_mclaughlin':          return pipeDuctNu.sebanMcLaughlin(Re, Pr, D, dims.D_c ?? 0.5, regime);
      case 'webb_eckert_goldstein':     return pipeDuctNu.webbEckertGoldstein(Re, Pr, dims.e ?? 0.001, D);
      case 'isachenko_roughness':       return pipeDuctNu.isachenkoRoughness(Re, Pr, dims.e ?? 0.001, D);
      default: throw new Error(`Unknown pipe/duct correlation: ${corr}`);
    }
  },
};

