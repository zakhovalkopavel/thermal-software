import { DimensionlessInputDto } from '../../dto/dimensionless.dto';

/**
 * Nu correlations for special geometries:
 * packed beds, rotating surfaces, impinging jets, condensation,
 * elliptical cylinders, cones.
 * All equations taken directly from cited sources.
 */
export const specialNu = {

  // ── Packed beds ────────────────────────────────────────────────────────

  /**
   * Gunn (1978) — packed bed, wide Re range
   * Nu = (7−10ε+5ε²)·(1+0.7·Re_p^0.2·Pr^(1/3)) + (1.33−2.4ε+1.2ε²)·Re_p^0.7·Pr^(1/3)
   * Source: [Leg HeatTransfer.js 22–27]; Gunn D.J. (1978) Int.J.Heat Mass Transfer 21:467
   * Range: Re [0–10⁵], ε [0.35–1.0]
   */
  gunn(re: number, pr: number, epsilon: number): number {
    const eps = epsilon;
    return (7 - 10*eps + 5*eps*eps) * (1 + 0.7 * Math.pow(re, 0.2) * Math.pow(pr, 1/3))
      + (1.33 - 2.4*eps + 1.2*eps*eps) * Math.pow(re, 0.7) * Math.pow(pr, 1/3);
  },

  /**
   * Wakao & Funazkri (1978) — packed bed, mass/heat transfer
   * Nu = 2 + 1.1·Re^0.6·Pr^(1/3)
   * Source: Wakao N., Funazkri T. (1978) Chem.Eng.Sci. 33:1375; [VDI M8]
   */
  wakaoFunazkri(re: number, pr: number): number {
    return 2 + 1.1 * Math.pow(re, 0.6) * Math.pow(pr, 1/3);
  },

  /**
   * Whitaker (1972) — packed bed with viscosity correction
   * Nu = (0.5·Re^0.5 + 0.2·Re^(2/3))·Pr^(1/3)·(μ/μ_s)^0.25
   * Source: Whitaker S. (1972) AIChE J. 18:361, Eq.(17)
   * Range: Re [10–10⁴], Pr [0.7–380]
   */
  whitakerPackedBed(re: number, pr: number, mu: number, mu_s: number): number {
    return (0.5 * Math.pow(re, 0.5) + 0.2 * Math.pow(re, 2/3))
      * Math.pow(pr, 1/3) * Math.pow(mu / mu_s, 0.25);
  },

  // ── Rotating surfaces ──────────────────────────────────────────────────

  /**
   * Dorfman — rotating disk
   * Re_ω = ω·r²/ν
   * Laminar (Re_ω < 2.5×10⁵): Nu = 0.36·Re_ω^0.5·Pr^0.6
   * Turbulent:                  Nu = 0.0195·Re_ω^0.8·Pr^0.6
   * Source: Dorfman L.A. (1963) Hydrodynamic Resistance; [VDI H4]
   */
  dorfmanDisk(re: number, pr: number, params: DimensionlessInputDto): number {
    const dims  = params.dims ?? {};
    const nu_f  = (params.mu_Pa_s !== undefined && params.rho_kg_m3 !== undefined)
      ? params.mu_Pa_s / params.rho_kg_m3 : 1.5e-5;
    const Re_w  = (dims.omega !== undefined && dims.a !== undefined)
      ? dims.omega * dims.a * dims.a / nu_f : re;
    return Re_w < 2.5e5
      ? 0.36  * Math.pow(Re_w, 0.5) * Math.pow(pr, 0.6)
      : 0.0195 * Math.pow(Re_w, 0.8) * Math.pow(pr, 0.6);
  },

  /**
   * Bjorklund & Kays (1959) — rotating cylinder (Taylor-Couette)
   * Nu = 0.386·(Ta·Pr)^0.5
   * Source: Bjorklund I.C., Kays W.M. (1959) J.Heat Transfer 81:175; [VDI H5]
   */
  bjorklundKays(pr: number, params: DimensionlessInputDto): number {
    const dims  = params.dims ?? {};
    const nu_f  = (params.mu_Pa_s !== undefined && params.rho_kg_m3 !== undefined)
      ? params.mu_Pa_s / params.rho_kg_m3 : 1.5e-5;
    const r_i   = dims.a ?? 0.05;
    const delta = (dims.b ?? 0.1) - r_i;
    const Ta    = (dims.omega ?? 10) ** 2 * r_i * Math.pow(delta, 3) / (nu_f * nu_f);
    return 0.386 * Math.pow(Ta * pr, 0.5);
  },

  // ── Impinging jets ─────────────────────────────────────────────────────

  /**
   * Martin (1977) — single impinging jet
   * Nu = G·Re_D^0.5·Pr^0.42
   * G = (D/r)·[(1−1.1·D/r)/(1+0.1·(H/D−6)·D/r)]^0.5
   * Source: Martin H. (1977) Adv.Heat Transfer 13:1; [VDI G8]
   * Range: Re [2000–4×10⁵]
   */
  martinJetSingle(re: number, pr: number, params: DimensionlessInputDto, D: number): number {
    const dims = params.dims ?? {};
    const Hd = (dims.H ?? 6) / D;
    const rd = (dims.r ?? 3 * D) / D;
    const G  = (1/rd) * Math.sqrt(Math.max(0, (1 - 1.1/rd) / (1 + 0.1 * (Hd - 6) / rd)));
    return G * Math.pow(re, 0.5) * Math.pow(pr, 0.42);
  },

  /**
   * Martin (1977) — array of impinging jets
   * Source: Martin H. (1977) Adv.Heat Transfer 13:1; [VDI G8]
   * Range: Re [2000–4×10⁵]
   */
  martinJetArray(re: number, pr: number, params: DimensionlessInputDto, D: number): number {
    const dims = params.dims ?? {};
    const Hd = (dims.H ?? 6) / D;
    const rd = (dims.r ?? 3 * D) / D;
    const f  = dims.f_jet ?? 0.02;
    const G  = (1/rd) * Math.sqrt(Math.max(0, (1 - 1.1/rd) / (1 + 0.1 * (Hd - 6) / rd)));
    const K  = Math.pow(1 + Math.pow(Hd / (0.6 / Math.sqrt(f)), 6), -0.05);
    return K * G * Math.pow(re, 0.5) * Math.pow(pr, 0.42);
  },

  // ── Condensation ───────────────────────────────────────────────────────

  /**
   * Nusselt (1916) — film condensation
   * Full condensation needs ρ_l, ρ_v, h_fg, μ_l — placeholder returns 0.
   * Source: Nusselt W. (1916) Z.VDI 60:541
   */
  nusseltCondensation(): number { return 0; },

  /** Chen (1961) — two-phase convective condensation (placeholder)
   * Source: Chen J.C. (1966) I&EC Process Des. Dev. 5:322
   */
  chenCondensation(): number { return 0; },

  // ── Other external geometries ──────────────────────────────────────────

  /**
   * Owen (1952) — elliptical cylinder in crossflow
   * Nu = 0.228·Re^0.731·Pr^(1/3)   (simplified from Owen's tabulated data)
   * Source: Owen P.R. (1952) Aero.Quart. 3:230
   */
  ellipticalCylinderOwen(re: number, pr: number): number {
    return 0.228 * Math.pow(re, 0.731) * Math.pow(pr, 1/3);
  },

  /**
   * Yuge (1960) — cone in crossflow
   * Nu ≈ 0.58·Re^0.5·Pr^(1/3)
   * Source: Yuge T. (1960) J.Heat Transfer 82:214; [VDI F6]
   */
  coneYuge(re: number, pr: number): number {
    return 0.58 * Math.pow(re, 0.5) * Math.pow(pr, 1/3);
  },

  // ── Dispatcher ─────────────────────────────────────────────────────────
  compute(corr: string, re: number, pr: number, mu: number, mu_s: number,
          params: DimensionlessInputDto, D: number): number {
    const dims = params.dims ?? {};
    switch (corr) {
      case 'gunn':               return specialNu.gunn(re, pr, dims.epsilon ?? 0.4);
      case 'wakao_funazkri':     return specialNu.wakaoFunazkri(re, pr);
      case 'whitaker_packed_bed':return specialNu.whitakerPackedBed(re, pr, mu, mu_s);
      case 'dorfman_disk':       return specialNu.dorfmanDisk(re, pr, params);
      case 'bjorklund_kays':     return specialNu.bjorklundKays(pr, params);
      case 'martin_jet_single':  return specialNu.martinJetSingle(re, pr, params, D);
      case 'martin_jet_array':   return specialNu.martinJetArray(re, pr, params, D);
      case 'nusselt_condensation':return specialNu.nusseltCondensation();
      case 'chen_condensation':  return specialNu.chenCondensation();
      case 'elliptical_cylinder_owen': return specialNu.ellipticalCylinderOwen(re, pr);
      case 'cone_yuge':          return specialNu.coneYuge(re, pr);
      default: throw new Error(`Unknown special correlation: ${corr}`);
    }
  },
};

