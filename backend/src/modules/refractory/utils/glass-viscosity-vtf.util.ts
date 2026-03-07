/**
 * VTF Glass Viscosity Models
 *
 * Pure VTF (Vogel-Tammann-Fulcher) and isokom regression functions.
 * No NestJS @Injectable — plain functions, usable anywhere.
 *
 * Contents:
 *   checkLakatosValidity        — Validity check for Lakatos 1976 composition range
 *   predictIsokomsLakatos       — Lakatos 1976 isokom regression (soda-lime-silica)
 *   predictIsokomsFluegel       — Fluegel 2007 polynomial regression (~50 components)
 *   buildVtf                    — Fit VTF from isokom output for the selected model
 *   fitVtfThreePoints           — Analytical 3-point VTF fit
 *   evalVtf                     — Forward VTF: T → log η
 *   temperatureAtLogViscosity   — Inverse VTF: log η → T
 *   calculateFixedPointsFromVtf — All ASTM C965-96 fixed points from a VTF triple
 *
 * References:
 *   Lakatos, T.; Johansson, L-G.; Simmingskőld, B. (1976).
 *   Fluegel, A. (2007). Glass Technology 48(1):13–30.
 *   ASTM C965-96: Standard Practice for Measuring Viscosity of Glass.
 */

import {
  VtfPoint,
  VtfParameters,
  LakatosIsokoms,
  FluegelIsokoms,
  ModelSelectionResult,
} from '../interfaces/viscosity-parameters.interface';
import { FixedPoints } from '../interfaces/glass-viscosity.interface';
import {
  LAKATOS_1976_COEFFICIENTS,
  FLUEGEL_2007_T1_5,
  FLUEGEL_2007_T6_6,
  FLUEGEL_2007_T12,
  FLUEGEL_2007_BOUNDS,
} from '../constants/viscosity-parameters';
import { ViscosityModel } from '../enums/viscosity-model.enum';
import { wtPctToMolPct } from './glass-composition.util';


// ─── Lakatos 1976 ─────────────────────────────────────────────────────────────

/**
 * Predict three isokom temperatures using the Lakatos 1976 regression.
 *
 * Input:  normalised wt% composition
 * Output: T in °C at log η = 1, 3, 5 Pa·s
 *         (Lakatos paper uses poise levels 2, 4, 6; subtract 1 to convert to Pa·s)
 *
 * Algorithm:
 *   1. Convert wt% to parts-per-100-SiO₂  (x_i = wt_i / wt_SiO₂ × 100)
 *   2. Apply linear regression from LAKATOS_1976_COEFFICIENTS with quadratic B₂O₃ term
 *
 * Validity range: SiO₂ 60–77 wt%, Na₂O 10–17 wt%, 11 components.
 */
export function predictIsokomsLakatos(
  comp: Record<string, number>,
): LakatosIsokoms {
  const SiO2 = comp['SiO2'] ?? 0;
  if (SiO2 <= 0) {
    throw new Error('Lakatos model requires SiO₂ > 0 wt%');
  }

  // Convert to parts per 100 parts SiO₂
  const x = (key: string) => ((comp[key] ?? 0) / SiO2) * 100;

  const xAl2O3 = x('Al2O3');
  const xNa2O  = x('Na2O');
  const xK2O   = x('K2O');
  const xLi2O  = x('Li2O');
  const xCaO   = x('CaO');
  const xMgO   = x('MgO');
  const xBaO   = x('BaO');
  const xZnO   = x('ZnO');
  const xPbO   = x('PbO');
  const xB2O3  = x('B2O3');

  const c  = LAKATOS_1976_COEFFICIENTS;
  const co = c.components;

  const evalLevel = (v: 'v2' | 'v4' | 'v6'): number =>
    c.constant[v]
    + co.Al2O3[v] * xAl2O3
    + co.Na2O[v]  * xNa2O
    + co.K2O[v]   * xK2O
    + co.Li2O[v]  * xLi2O
    + co.CaO[v]   * xCaO
    + co.MgO[v]   * xMgO
    + co.BaO[v]   * xBaO
    + co.ZnO[v]   * xZnO
    + co.PbO[v]   * xPbO
    + co.B2O3[v]  * xB2O3
    + c.B2O3_quadratic[v] * xB2O3 * xB2O3;

  const T_v2 = evalLevel('v2');
  const T_v4 = evalLevel('v4');
  const T_v6 = evalLevel('v6');

  // Validity warnings
  const warnings: string[] = [];
  const b = c.validityBounds;

  const checkBound = (name: string, val: number, lo: number, hi: number) => {
    if (val < lo || val > hi) {
      warnings.push(
        `${name} = ${val.toFixed(2)} wt% is outside Lakatos training range [${lo}, ${hi}]`,
      );
    }
  };

  checkBound('SiO₂',  SiO2,               b.SiO2.min,  b.SiO2.max);
  checkBound('Na₂O',  comp['Na2O']  ?? 0, b.Na2O.min,  b.Na2O.max);
  checkBound('Al₂O₃', comp['Al2O3'] ?? 0, b.Al2O3.min, b.Al2O3.max);
  checkBound('K₂O',   comp['K2O']   ?? 0, b.K2O.min,   b.K2O.max);
  checkBound('Li₂O',  comp['Li2O']  ?? 0, b.Li2O.min,  b.Li2O.max);
  if ((comp['CaO'] ?? 0) > 0) {
    checkBound('CaO', comp['CaO'] ?? 0, b.CaO.min, b.CaO.max);
  }
  checkBound('MgO',  comp['MgO']  ?? 0, b.MgO.min,  b.MgO.max);
  checkBound('BaO',  comp['BaO']  ?? 0, b.BaO.min,  b.BaO.max);
  checkBound('ZnO',  comp['ZnO']  ?? 0, b.ZnO.min,  b.ZnO.max);
  checkBound('PbO',  comp['PbO']  ?? 0, b.PbO.min,  b.PbO.max);
  checkBound('B₂O₃', comp['B2O3'] ?? 0, b.B2O3.min, b.B2O3.max);

  // Warn about non-Lakatos components present at > 2 wt% total
  const lakatosSet = new Set([
    'SiO2','Al2O3','Na2O','K2O','Li2O','CaO','MgO','BaO','ZnO','PbO','B2O3',
  ]);
  let ignoredWt = 0;
  const ignoredNames: string[] = [];
  for (const [k, v] of Object.entries(comp)) {
    if (!lakatosSet.has(k) && v > 0) {
      ignoredWt += v;
      ignoredNames.push(k);
    }
  }
  if (ignoredNames.length > 0 && ignoredWt > 2) {
    warnings.push(
      `Components not modelled by Lakatos: ${ignoredNames.join(', ')} ` +
      `(${ignoredWt.toFixed(1)} wt% total). Fluegel 2007 may give better coverage.`,
    );
  }

  return { T_logEta1: T_v2, T_logEta3: T_v4, T_logEta5: T_v6, warnings };
}

// ─── Fluegel 2007 ─────────────────────────────────────────────────────────────

/**
 * Predict three isokom temperatures using the Fluegel 2007 polynomial regression.
 *
 * Input:  normalised wt% composition
 * Output: T in °C at log η = 1.5, 6.6, 12.0 Pa·s
 *
 * Algorithm:
 *   1. Convert wt% → mol% (full-denominator including SiO₂)
 *   2. Apply the three regression tables (Tables 4, 5, 6 of the paper)
 *      using linear + polynomial + cross terms
 *
 * Validity: SiO₂ 42.6–89.2 mol%, ~50 components, σ = 9–17°C.
 */
export function predictIsokomsFluegel(
  comp: Record<string, number>,
): FluegelIsokoms {
  const molPct = wtPctToMolPct(comp);
  const C = (k: string) => molPct[k] ?? 0;

  type FlugelTable =
    | typeof FLUEGEL_2007_T1_5
    | typeof FLUEGEL_2007_T6_6
    | typeof FLUEGEL_2007_T12;

  const evalTable = (tbl: FlugelTable): number => {
    let T = tbl.constant;

    for (const [k, coeff] of Object.entries(tbl.linear)) {
      T += coeff * C(k);
    }
    for (const [k, coeff] of Object.entries(tbl.quadratic)) {
      T += coeff * C(k) ** 2;
    }
    for (const [k, coeff] of Object.entries(tbl.cubic)) {
      T += coeff * C(k) ** 3;
    }
    for (const [key, coeff] of Object.entries(tbl.cross)) {
      const [a, b] = key.split('*');
      T += coeff * C(a) * C(b);
    }
    for (const [key, coeff] of Object.entries(tbl.cross3)) {
      const [a, b, cc] = key.split('*');
      T += coeff * C(a) * C(b) * C(cc);
    }

    return T;
  };

  const T_1_5 = evalTable(FLUEGEL_2007_T1_5);
  const T_6_6 = evalTable(FLUEGEL_2007_T6_6);
  const T_12  = evalTable(FLUEGEL_2007_T12);

  // Validity warnings
  const warnings: string[] = [];
  const SiO2Mol = molPct['SiO2'] ?? 0;

  if (SiO2Mol < FLUEGEL_2007_BOUNDS.SiO2_min) {
    warnings.push(
      `SiO₂ = ${SiO2Mol.toFixed(1)} mol% < Fluegel minimum (${FLUEGEL_2007_BOUNDS.SiO2_min})`,
    );
  }
  if (SiO2Mol > FLUEGEL_2007_BOUNDS.SiO2_max) {
    warnings.push(
      `SiO₂ = ${SiO2Mol.toFixed(1)} mol% > Fluegel maximum (${FLUEGEL_2007_BOUNDS.SiO2_max})`,
    );
  }

  const boundKeys = Object.keys(FLUEGEL_2007_BOUNDS).filter(
    k => k !== 'SiO2_min' && k !== 'SiO2_max',
  ) as (keyof typeof FLUEGEL_2007_BOUNDS)[];

  for (const k of boundKeys) {
    const maxArr = FLUEGEL_2007_BOUNDS[k] as unknown as number[];
    const maxAt6_6 = maxArr[1];
    const val = molPct[k as string] ?? 0;
    if (val > maxAt6_6 && maxAt6_6 > 0) {
      warnings.push(
        `${k} = ${val.toFixed(2)} mol% exceeds Fluegel max at log η 6.6 (${maxAt6_6} mol%)`,
      );
    }
  }

  return { T_logEta1_5: T_1_5, T_logEta6_6: T_6_6, T_logEta12: T_12, warnings };
}

// ─── buildVtf ─────────────────────────────────────────────────────────────────

/**
 * Fit a VTF curve for the given composition using the model indicated in
 * `selection.primary` (must be LAKATOS_1976 or FLUEGEL_2007).
 *
 * Runs the appropriate isokom regression then calls fitVtfThreePoints.
 *
 * @param comp       Normalised wt% composition
 * @param selection  Resolved model selection (primary must be a VTF model)
 * @returns          VTF parameters, bibliographic reference, and isokom warnings
 */
export function buildVtf(
  comp: Record<string, number>,
  selection: ModelSelectionResult,
): { vtf: VtfParameters; modelRef: string; isokomWarnings: string[] } {
  if (selection.primary === ViscosityModel.LAKATOS_1976) {
    const iso = predictIsokomsLakatos(comp);
    const vtf = fitVtfThreePoints(
      { T_celsius: iso.T_logEta1, logEtaPaS: 1 },
      { T_celsius: iso.T_logEta3, logEtaPaS: 3 },
      { T_celsius: iso.T_logEta5, logEtaPaS: 5 },
    );
    return { vtf, modelRef: LAKATOS_1976_COEFFICIENTS.reference, isokomWarnings: iso.warnings };
  }

  // FLUEGEL_2007
  const iso = predictIsokomsFluegel(comp);
  const vtf = fitVtfThreePoints(
    { T_celsius: iso.T_logEta1_5, logEtaPaS: 1.5 },
    { T_celsius: iso.T_logEta6_6, logEtaPaS: 6.6 },
    { T_celsius: iso.T_logEta12,  logEtaPaS: 12  },
  );
  return {
    vtf,
    modelRef: 'Fluegel, A. (2007). Glass Technology: Eur. J. Glass Sci. Technol. A 48(1):13–30.',
    isokomWarnings: iso.warnings,
  };
}

// ─── VTF three-point fit ──────────────────────────────────────────────────────

/**
 * Fit VTF parameters analytically from exactly three (T, log η) pairs.
 *
 * Formula:  log₁₀(η [Pa·s]) = A + B / (T [°C] − T₀)
 *
 * Derivation — determinant (cross-ratio) form (Ch. 7):
 *   T₀ = [T₂·T₃·(y₂−y₃) + T₁·T₃·(y₃−y₁) + T₁·T₂·(y₁−y₂)]
 *        / [T₃·(y₂−y₃)   + T₁·(y₃−y₁)   + T₂·(y₁−y₂)]
 *   B  = (y₂−y₁) · (T₁−T₀) · (T₂−T₀) / (T₁−T₂)
 *   A  = y₁ − B / (T₁−T₀)
 *
 * This determinant form is more numerically stable than the R-ratio form
 * because its denominator scales with temperature differences, not viscosity
 * differences alone.
 *
 * With exactly 3 points and 3 unknowns the system is exactly determined —
 * no iterative regression is needed or appropriate here.
 *
 * Throws VTF_FIT_SINGULAR if the three points are collinear (Arrhenius-like).
 * Throws VTF_FIT_INVALID_T0 / VTF_FIT_INVALID_B if result is non-physical.
 */
export function fitVtfThreePoints(
  p1: VtfPoint,
  p2: VtfPoint,
  p3: VtfPoint,
): VtfParameters {
  // Sort descending T: T1 > T2 > T3, y1 < y2 < y3
  const pts = [p1, p2, p3].sort((a, b) => b.T_celsius - a.T_celsius);
  const [q1, q2, q3] = pts;
  const T1 = q1.T_celsius, y1 = q1.logEtaPaS;
  const T2 = q2.T_celsius, y2 = q2.logEtaPaS;
  const T3 = q3.T_celsius, y3 = q3.logEtaPaS;

  // Determinant form — numerically superior to R-ratio (Ch. 7 §Stable Three-Point Algorithm)
  const num = T2 * T3 * (y2 - y3) + T1 * T3 * (y3 - y1) + T1 * T2 * (y1 - y2);
  const den = T3 * (y2 - y3)      + T1 * (y3 - y1)      + T2 * (y1 - y2);

  if (Math.abs(den) < 1e-12) {
    throw new Error(
      'VTF_FIT_SINGULAR: three isokom points are collinear in (T, log η) space — ' +
      'composition may be outside model range',
    );
  }

  const T0 = num / den;

  if (T0 <= 0) {
    throw new Error(
      `VTF_FIT_INVALID_T0: T₀ = ${T0.toFixed(1)}°C is non-physical (must be > 0°C)`,
    );
  }
  if (T0 >= T3) {
    throw new Error(
      `VTF_FIT_INVALID_T0: T₀ = ${T0.toFixed(1)}°C ≥ lowest isokom T = ${T3.toFixed(1)}°C`,
    );
  }

  const B = (y2 - y1) * (T2 - T0) * (T1 - T0) / (T1 - T2);

  if (B <= 0) {
    throw new Error(
      `VTF_FIT_INVALID_B: B = ${B.toFixed(1)} K is non-physical (must be > 0)`,
    );
  }

  const A = y1 - B / (T1 - T0);

  return { A, B, T0 };
}

// ─── VTF evaluation ───────────────────────────────────────────────────────────

/**
 * Forward VTF: temperature → log₁₀(η [Pa·s])
 * Clamps near-T₀ singularity to log η = 15.
 */
export function evalVtf(vtf: VtfParameters, T_celsius: number): number {
  const denom = T_celsius - vtf.T0;
  if (Math.abs(denom) < 1) return 15;
  return vtf.A + vtf.B / denom;
}

/**
 * Inverse VTF: target log η → temperature in °C.
 * T = B / (log η − A) + T₀
 */
export function temperatureAtLogViscosity(
  vtf: VtfParameters,
  targetLogEta: number,
): number {
  const denom = targetLogEta - vtf.A;
  if (Math.abs(denom) < 1e-10) {
    throw new Error(
      `Target log η = ${targetLogEta} equals A = ${vtf.A.toFixed(3)} ` +
      `— viscosity is asymptotically unreachable`,
    );
  }
  return vtf.B / denom + vtf.T0;
}

// ─── Fixed points ─────────────────────────────────────────────────────────────

/**
 * Calculate all ASTM C965-96 fixed points from a VTF parameter set.
 *
 * Fixed-point log₁₀(η [Pa·s]) targets:
 *   Melting  : 1.0    Working : 3.0    Flow     : 4.0
 *   Softening: 6.6    Annealing: 12.0  Strain   : 13.5
 */
export function calculateFixedPointsFromVtf(vtf: VtfParameters): FixedPoints {
  const T = (logEta: number) => temperatureAtLogViscosity(vtf, logEta);

  const fp: FixedPoints = {
    meltingPoint_C:   T(1.0),
    workingPoint_C:   T(3.0),
    flowPoint_C:      T(4.0),
    softeningPoint_C: T(6.6),
    annealingPoint_C: T(12.0),
    strainPoint_C:    T(13.5),
  };

  fp.spans = {
    meltingToStrain_C:      fp.meltingPoint_C   - fp.strainPoint_C,
    workingToSoftening_C:   fp.workingPoint_C   - fp.softeningPoint_C,
    softeningToAnnealing_C: fp.softeningPoint_C - fp.annealingPoint_C,
    annealingToStrain_C:    fp.annealingPoint_C - fp.strainPoint_C,
  };

  return fp;
}

// ─── Lakatos validity ─────────────────────────────────────────────────────────

/**
 * Determine whether a normalised wt% composition falls within the Lakatos 1976
 * training range, and collect soft-warning messages for boundary components.
 *
 * Hard failures (return valid=false):
 *   - SiO₂ outside [50, 77.5] wt%
 *   - Na₂O < 10 wt%  (required network modifier in the training set)
 *   - > 5 wt% of components not in the Lakatos component list
 *
 * Soft warnings (return valid=true but populate warnings[]):
 *   - Na₂O slightly above 17 wt%
 *   - Al₂O₃, K₂O, B₂O₃ outside their trained range
 */
export function checkLakatosValidity(
  comp: Record<string, number>,
): { valid: boolean; reason?: string; warnings: string[] } {
  const SiO2 = comp['SiO2'] ?? 0;
  const Na2O = comp['Na2O'] ?? 0;
  const b    = LAKATOS_1976_COEFFICIENTS.validityBounds;
  const warnings: string[] = [];

  if (SiO2 < b.SiO2.min || SiO2 > b.SiO2.max + 0.5) {
    return {
      valid: false,
      reason: `SiO₂ = ${SiO2.toFixed(1)} wt% outside Lakatos range [${b.SiO2.min}, ${b.SiO2.max}]`,
      warnings,
    };
  }
  if (Na2O < b.Na2O.min) {
    return {
      valid: false,
      reason: `Na₂O = ${Na2O.toFixed(1)} wt% < Lakatos minimum ${b.Na2O.min} wt%`,
      warnings,
    };
  }
  if (Na2O > b.Na2O.max) {
    warnings.push(`Na₂O = ${Na2O.toFixed(1)} wt% slightly above Lakatos max (${b.Na2O.max} wt%)`);
  }

  const lakatosSet = new Set([
    'SiO2', 'Al2O3', 'Na2O', 'K2O', 'Li2O', 'CaO', 'MgO', 'BaO', 'ZnO', 'PbO', 'B2O3',
  ]);
  let outsideWt = 0;
  for (const [k, v] of Object.entries(comp)) {
    if (!lakatosSet.has(k) && v > 0) outsideWt += v;
  }
  if (outsideWt > 5) {
    return {
      valid: false,
      reason: `${outsideWt.toFixed(1)} wt% of composition outside Lakatos component list — use Fluegel 2007`,
      warnings,
    };
  }

  const checkSoft = (name: string, key: string, lo: number, hi: number) => {
    const v = comp[key] ?? 0;
    if (v < lo || v > hi) {
      warnings.push(`${name} = ${v.toFixed(2)} wt% outside Lakatos training range [${lo}, ${hi}]`);
    }
  };
  checkSoft('Al₂O₃', 'Al2O3', b.Al2O3.min, b.Al2O3.max);
  checkSoft('K₂O',   'K2O',   b.K2O.min,   b.K2O.max);
  checkSoft('B₂O₃',  'B2O3',  b.B2O3.min,  b.B2O3.max);

  return { valid: true, warnings };
}
