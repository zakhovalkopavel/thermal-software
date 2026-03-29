import { GeometryDimsDto } from '../../dto/geometry-dims.dto';
import { morganCoeffs, macGregorEmery } from '../nu-coefficients.helper';

/**
 * Nu correlations for natural convection.
 * All equations taken directly from cited sources.
 */
export const naturalConvectionNu = {

  // ── Vertical plate / cylinder ──────────────────────────────────────────

  /**
   * Churchill & Chu (1975a) — laminar range, vertical plate/cylinder
   * Nu = 0.68 + 0.670·Ra^(1/4) / [1+(0.492/Pr)^(9/16)]^(4/9)
   * Source: Churchill S.W., Chu H.H.S. (1975) Int.J.Heat Mass Transfer 18:1323, Eq.(1)
   * Range: Ra < 10⁹
   */
  churchillChuLaminar(ra: number, pr: number): number {
    return 0.68 + 0.670 * Math.pow(ra, 0.25)
      / Math.pow(1 + Math.pow(0.492 / pr, 9/16), 4/9);
  },

  /**
   * Churchill & Chu (1975a) — all Ra, vertical plate/cylinder
   * Nu = [0.825 + 0.387·Ra^(1/6) / (1+(0.492/Pr)^(9/16))^(8/27)]²
   * Source: Churchill S.W., Chu H.H.S. (1975) Int.J.Heat Mass Transfer 18:1323, Eq.(2)
   * Range: Ra [0.1–10¹²]
   */
  churchillChuAllRa(ra: number, pr: number): number {
    const inner = 0.825 + 0.387 * Math.pow(ra, 1/6)
      / Math.pow(1 + Math.pow(0.492 / pr, 9/16), 8/27);
    return inner * inner;
  },

  /**
   * Churchill & Chu (1975a) — auto-select by Ra (recommended default)
   * Source: [Leg 819–820]
   */
  churchillChu(ra: number, pr: number): number {
    return ra < 1e9
      ? naturalConvectionNu.churchillChuLaminar(ra, pr)
      : naturalConvectionNu.churchillChuAllRa(ra, pr);
  },

  // ── Horizontal cylinder ────────────────────────────────────────────────

  /**
   * Morgan (1975) — horizontal cylinder, range-table form
   * Nu = C·Ra_D^n
   * Source: Morgan V.T. (1975) Adv.Heat Transfer 11:199; [I7 §9.6]
   * Range: Ra [10⁻¹⁰–10¹²]
   */
  morgan(ra: number): number {
    const [C, n] = morganCoeffs(ra);
    return C * Math.pow(ra, n);
  },

  /**
   * Churchill & Chu (1975b) — horizontal cylinder, all Ra
   * Nu = [0.60 + 0.387·Ra^(1/6) / (1+(0.559/Pr)^(9/16))^(8/27)]²
   * Source: Churchill S.W., Chu H.H.S. (1975) Int.J.Heat Mass Transfer 18:1049, Eq.(1)
   * Range: Ra [10⁻⁵–10¹²]
   */
  churchillChuHorizontal(ra: number, pr: number): number {
    const inner = 0.60 + 0.387 * Math.pow(ra, 1/6)
      / Math.pow(1 + Math.pow(0.559 / pr, 9/16), 8/27);
    return inner * inner;
  },

  // ── Horizontal plate ───────────────────────────────────────────────────

  /**
   * McAdams (1954) — heated plate facing up / cooled plate facing down
   * 10⁴ ≤ Ra ≤ 10⁷: Nu = 0.54·Ra^0.25
   * 10⁷ ≤ Ra ≤ 10¹¹: Nu = 0.15·Ra^(1/3)
   * Source: McAdams W.H. (1954) Heat Transmission 3rd ed.; [I7 §9.7]
   */
  mcAdamsHotUp(ra: number): number {
    return ra < 1e7 ? 0.54 * Math.pow(ra, 0.25) : 0.15 * Math.pow(ra, 1/3);
  },

  /**
   * McAdams (1954) — heated plate facing down / cooled plate facing up
   * Nu = 0.27·Ra^0.25
   * Source: McAdams W.H. (1954); [I7 §9.7]
   * Range: Ra [10⁵–10¹¹]
   */
  mcAdamsHotDown(ra: number): number {
    return 0.27 * Math.pow(ra, 0.25);
  },

  // ── Inclined plate ─────────────────────────────────────────────────────

  /**
   * Churchill (1977) — inclined plate (angle θ from vertical)
   * Uses Churchill–Chu with g_eff = g·cos(θ), i.e. Ra_eff = Ra·cos(θ)
   * Source: Churchill S.W. (1977) AIChE J. 22:543
   */
  churchillInclined(ra: number, pr: number, angle_deg: number): number {
    const Ra_eff = ra * Math.cos((angle_deg * Math.PI) / 180);
    return Ra_eff < 1e9
      ? naturalConvectionNu.churchillChuLaminar(Ra_eff, pr)
      : naturalConvectionNu.churchillChuAllRa(Ra_eff, pr);
  },

  // ── Sphere ─────────────────────────────────────────────────────────────

  /**
   * Churchill (1983) — natural convection from sphere
   * Nu = 2 + 0.589·Ra^(1/4) / [1+(0.469/Pr)^(9/16)]^(4/9)
   * Source: Churchill S.W. (1983); [I7 §9.9] Eq.(9.35)
   * Range: Ra [0–10¹¹], Pr ≥ 0.7
   */
  churchillSphereNatural(ra: number, pr: number): number {
    return 2 + 0.589 * Math.pow(ra, 0.25)
      / Math.pow(1 + Math.pow(0.469 / pr, 9/16), 4/9);
  },

  // ── Concentric geometries ──────────────────────────────────────────────

  /**
   * Raithby & Hollands (1975) — concentric cylinders
   * k_eff/k = 0.386·(Pr/(0.861+Pr))^(1/4)·Ra_c^(1/4)
   * Source: Raithby G.D., Hollands K.G.T. (1975) J.Heat Transfer 97:96; [I7 §9.7]
   */
  raithbyHollandsCylinders(ra: number, pr: number): number {
    return 0.386 * Math.pow(pr / (0.861 + pr), 0.25) * Math.pow(ra, 0.25);
  },

  /**
   * Raithby & Hollands (1975) — concentric spheres
   * k_eff/k = 0.74·(Pr/(0.861+Pr))^(1/4)·Ra_δ^(1/4)
   * Source: Raithby G.D., Hollands K.G.T. (1975) J.Heat Transfer 97:96; [I7 §9.7]
   */
  raithbyHollandsSpheres(ra: number, pr: number): number {
    return 0.74 * Math.pow(pr / (0.861 + pr), 0.25) * Math.pow(ra, 0.25);
  },

  // ── Cavities ───────────────────────────────────────────────────────────

  /**
   * Hollands et al. (1976) — horizontal cavity (heated from below)
   * Nu = 1 + 1.44·[1−1708/Ra]⁺ + [(Ra/5830)^(1/3)−1]⁺
   * Source: Hollands K.G.T. et al. (1976) J.Heat Transfer 98:189; [I7 §9.9]
   * Range: Ra [1708–10⁸]
   */
  hollands(ra: number): number {
    const t1 = Math.max(0, 1 - 1708 / ra);
    const t2 = Math.max(0, Math.pow(ra / 5830, 1/3) - 1);
    return 1 + 1.44 * t1 + t2;
  },

  /**
   * Globe & Dropkin (1959) — horizontal cavity, simplified
   * Nu = 0.069·Ra^(1/3)·Pr^0.074
   * Source: Globe S., Dropkin D. (1959) J.Heat Transfer 81:24; [I7 §9.9]
   * Range: Ra [3×10⁵–7×10⁹]
   */
  globeDropkin(ra: number, pr: number): number {
    return 0.069 * Math.pow(ra, 1/3) * Math.pow(pr, 0.074);
  },

  /**
   * MacGregor & Emery (1969) — vertical cavity
   * Source: MacGregor R.K., Emery A.P. (1969) J.Heat Transfer 91:391; [I7 §9.9]
   * Range: H/L ≤ 40, Ra [10³–10¹⁰]
   */
  macGregorEmery(ra: number, pr: number, dims: GeometryDimsDto): number {
    return macGregorEmery(ra, (dims.b ?? 1) / (dims.a ?? 1), pr);
  },

  // ── Mixed convection ───────────────────────────────────────────────────

  /**
   * Churchill (1977) — mixed convection, power-sum combination
   * Nu_comb = (Nu_forced^n ± Nu_natural^n)^(1/n)   n=3
   * Source: Churchill S.W. (1977) AIChE J. 23:10
   */
  mixedPowerSum(re: number, pr: number, ra: number): number {
    const Nu_f = 0.023 * Math.pow(re, 0.8) * Math.pow(pr, 0.4);
    const inner = 0.825 + 0.387 * Math.pow(ra, 1/6)
      / Math.pow(1 + Math.pow(0.492 / pr, 9/16), 8/27);
    const Nu_n = inner * inner;
    return Math.pow(Math.pow(Nu_f, 3) + Math.pow(Nu_n, 3), 1/3);
  },

  // ── Dispatcher ─────────────────────────────────────────────────────────
  compute(corr: string, re: number, pr: number, ra: number, dims: GeometryDimsDto): number {
    switch (corr) {
      case 'churchill_chu_laminar':      return naturalConvectionNu.churchillChuLaminar(ra, pr);
      case 'churchill_chu_all_ra':       return naturalConvectionNu.churchillChuAllRa(ra, pr);
      case 'churchill_chu':              return naturalConvectionNu.churchillChu(ra, pr);
      case 'morgan':                     return naturalConvectionNu.morgan(ra);
      case 'churchill_chu_horizontal':   return naturalConvectionNu.churchillChuHorizontal(ra, pr);
      case 'mcadams_hot_up':             return naturalConvectionNu.mcAdamsHotUp(ra);
      case 'mcadams_hot_down':           return naturalConvectionNu.mcAdamsHotDown(ra);
      case 'churchill_inclined':         return naturalConvectionNu.churchillInclined(ra, pr, dims.angle_deg ?? 0);
      case 'churchill_sphere_natural':   return naturalConvectionNu.churchillSphereNatural(ra, pr);
      case 'raithby_hollands_cylinders': return naturalConvectionNu.raithbyHollandsCylinders(ra, pr);
      case 'raithby_hollands_spheres':   return naturalConvectionNu.raithbyHollandsSpheres(ra, pr);
      case 'hollands':                   return naturalConvectionNu.hollands(ra);
      case 'globe_dropkin':              return naturalConvectionNu.globeDropkin(ra, pr);
      case 'macgregor_emery':            return naturalConvectionNu.macGregorEmery(ra, pr, dims);
      case 'mixed_power_sum':            return naturalConvectionNu.mixedPowerSum(re, pr, ra);
      default: throw new Error(`Unknown natural-convection correlation: ${corr}`);
    }
  },
};

