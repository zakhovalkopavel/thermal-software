import { Injectable, BadRequestException } from '@nestjs/common';
import { getComponentEffect } from '../data/component-properties';
import {
  GlassViscosityResult,
  ModelInfo,
  FixedPoints,
  ValidationStatus,
  ComponentBreakdown,
  ComponentEffect,
  CompositionIssue,
  GlassViscosityMetadata,
} from '../interfaces/glass-viscosity.interface';
import {
  VtfPoint,
  VtfParameters,
  LakatosIsokoms,
  FluegelIsokoms,
  ModelSelectionResult,
} from '../interfaces/viscosity-parameters.interface';
import {
  ViscosityModel,
  ViscosityModelNames,
  ViscosityModelType,
  ConfidenceLevel,
  ExtrapolationRisk,
} from '../enums/viscosity-model.enum';
import {
  LAKATOS_1976_COEFFICIENTS,
  FLUEGEL_2007_T1_5,
  FLUEGEL_2007_T6_6,
  FLUEGEL_2007_T12,
  FLUEGEL_2007_BOUNDS,
  HETHERINGTON_1964,
  MOLAR_MASSES,
} from '../constants/viscosity-parameters';

/**
 * Glass Viscosity Calculator Service — v2
 *
 * Implements only validated published models:
 *   1. Lakatos 1976 — isokom regression for soda-lime-silica and near-variants
 *   2. Fluegel 2007 — polynomial regression for broad silicate glass space
 *   3. Hetherington 1964 — fixed Arrhenius for pure fused silica (SiO₂ > 99%)
 *
 * Architecture (same for Lakatos and Fluegel):
 *   composition → predict 3 isokom temperatures → fit VTF analytically → evaluate fixed points
 *
 * Previous v1 had 9 fake/wrong models — removed 2026-03-06.
 * See docs/algorithms/glass-viscosity/VISCOSITY_PARAMETERS_AUDIT.md.
 *
 * References:
 *   Lakatos, T.; Johansson, L-G.; Simmingskőld, B. (1976). Aug 1976 supplement.
 *   Fluegel, A. (2007). Glass Technology 48(1):13–30.
 *   Hetherington, G. et al. (1964). Physics and Chemistry of Glasses 5(5):130–136.
 *   ASTM C965-96: Standard Practice for Measuring Viscosity of Glass Above the Softening Point.
 *
 * Fixed-point log₁₀(η [Pa·s]) targets (ASTM C965-96):
 *   Melting  : 1.0    Working : 3.0    Softening: 6.6
 *   Flow     : 4.0    Annealing: 12.0  Strain   : 13.5
 */
@Injectable()
export class GlassViscosityService {
  private readonly VERSION = '3.0.0';

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Calculate glass viscosity for a given composition and temperature.
   *
   * @param composition  Component formula keys → weight percent values
   * @param temperature  Temperature in °C
   * @returns Full result with VTF parameters, fixed points, and validation
   */
  calculateViscosity(
    composition: Record<string, number>,
    temperature: number,
  ): GlassViscosityResult {
    // 1. Normalise to 100 wt%
    const comp = this.normalizeComposition(composition);

    // 2. Select model
    const selection = this.selectModel(comp);
    const modelType = selection.primary;

    // 3. Route to the correct calculation path
    if (modelType === ViscosityModel.HETHERINGTON_1964) {
      return this.calculateHetherington(comp, temperature, selection);
    }
    if (modelType === ViscosityModel.NOT_SUPPORTED) {
      throw new BadRequestException(
        `Composition is outside all supported viscosity models. ` +
        `Reason: ${selection.reason}. ` +
        `For slags use URBAIN_1981 or RIBOUD_1981 (separate slag service). ` +
        `Pure fluoride glass has no reliable published regression.`,
      );
    }

    // Lakatos 1976 or Fluegel 2007 — both go through isokom → VTF → fixed-points
    let vtf: VtfParameters;
    let modelRef: string;
    let isokomWarnings: string[];

    if (modelType === ViscosityModel.LAKATOS_1976) {
      const iso = this.predictIsokomsLakatos(comp);
      isokomWarnings = iso.warnings;
      vtf = this.fitVtfThreePoints(
        { T_celsius: iso.T_logEta1, logEtaPaS: 1 },
        { T_celsius: iso.T_logEta3, logEtaPaS: 3 },
        { T_celsius: iso.T_logEta5, logEtaPaS: 5 },
      );
      modelRef = LAKATOS_1976_COEFFICIENTS.reference;
    } else {
      // FLUEGEL_2007
      const iso = this.predictIsokomsFluegel(comp);
      isokomWarnings = iso.warnings;
      vtf = this.fitVtfThreePoints(
        { T_celsius: iso.T_logEta1_5, logEtaPaS: 1.5 },
        { T_celsius: iso.T_logEta6_6, logEtaPaS: 6.6 },
        { T_celsius: iso.T_logEta12,  logEtaPaS: 12  },
      );
      modelRef =
        'Fluegel, A. (2007). Glass Technology: Eur. J. Glass Sci. Technol. A 48(1):13–30.';
    }

    // 4. Evaluate viscosity at the requested temperature
    const logViscosity = this.evalVtf(vtf, temperature);
    const viscosity_Pas = Math.max(1e-3, Math.min(1e15, Math.pow(10, logViscosity)));
    const logViscosityClamped = Math.log10(viscosity_Pas);

    // 5. Calculate all ASTM fixed points
    const fixedPoints = this.calculateFixedPointsFromVtf(vtf);

    // 6. Validation
    const allWarnings = [...selection.warnings, ...isokomWarnings];
    const vtfWarnings = this.validateFixedPointOrdering(fixedPoints);
    allWarnings.push(...vtfWarnings);

    const validation = this.buildValidationStatus(modelType, allWarnings);

    // 7. Component breakdown
    const components = this.buildComponentBreakdown(comp);

    // 8. Model info
    const modelInfo: ModelInfo = {
      type: ViscosityModelType.VFT,
      systemType: modelType,
      systemName: ViscosityModelNames[modelType],
      parameters: {
        A: vtf.A,
        B: vtf.B,
        T0: vtf.T0,
        temperatureRange: { min_C: 400, max_C: 1600 },
      },
    };

    const metadata: GlassViscosityMetadata = {
      calculatedAt: new Date(),
      modelType: ViscosityModelType.VFT,
      standard: 'ASTM_C965_96',
      confidence: validation.confidenceLevel,
      reference: modelRef,
      version: this.VERSION,
    };

    return {
      viscosity_Pas: Number(viscosity_Pas.toFixed(4)),
      temperature_C: temperature,
      logViscosity: Number(logViscosityClamped.toFixed(3)),
      model: modelInfo,
      fixedPoints,
      validation,
      components,
      composition: comp,
      metadata,
    };
  }

  // ─── Model selection ────────────────────────────────────────────────────────

  /**
   * Select the appropriate published model for a given normalised composition.
   *
   * Priority order (from IMPLEMENTATION_PLAN.md §3):
   *   1. SiO₂ > 99 wt%  → Hetherington 1964
   *   2. Slag (CaO > 30%, SiO₂ < 40%)  → NOT_SUPPORTED (use slag service)
   *   3. Pure fluoride (fluoride fraction > 20%)  → NOT_SUPPORTED
   *   4. Within Lakatos 1976 validity  → Lakatos 1976
   *   5. Otherwise  → Fluegel 2007
   */
  selectModel(comp: Record<string, number>): ModelSelectionResult {
    const SiO2 = comp['SiO2'] ?? 0;
    const CaO  = comp['CaO']  ?? 0;
    const Na2O = comp['Na2O'] ?? 0;
    const fluorides =
      (comp['CaF2'] ?? 0) + (comp['NaF'] ?? 0) + (comp['KF'] ?? 0) +
      (comp['MgF2'] ?? 0) + (comp['AlF3'] ?? 0) + (comp['LiF'] ?? 0) +
      (comp['F']    ?? 0);

    // 1. Pure silica
    if (SiO2 > 99) {
      return {
        primary: ViscosityModel.HETHERINGTON_1964,
        reason: `SiO₂ = ${SiO2.toFixed(1)} wt% — pure fused silica path`,
        warnings: [],
      };
    }

    // 2. Slag (above-liquidus melt — no glass fixed points)
    if (CaO > 30 && SiO2 < 40) {
      return {
        primary: ViscosityModel.NOT_SUPPORTED,
        secondary: ViscosityModel.RIBOUD_1981,
        reason: `CaO = ${CaO.toFixed(1)} wt%, SiO₂ = ${SiO2.toFixed(1)} wt% — slag outside glass models. Use Urbain 1981 or Riboud 1981.`,
        warnings: [],
      };
    }

    // 3. Pure / heavy fluoride glass
    if (fluorides > 20) {
      return {
        primary: ViscosityModel.NOT_SUPPORTED,
        reason: `Total fluoride = ${fluorides.toFixed(1)} wt% — pure fluoride glass has no reliable published regression.`,
        warnings: [],
      };
    }

    // 4. Lakatos 1976 validity check
    const lakatosResult = this.checkLakatosValidity(comp);
    if (lakatosResult.valid) {
      return {
        primary: ViscosityModel.LAKATOS_1976,
        reason: `Composition within Lakatos 1976 training range (SiO₂ ${SiO2.toFixed(1)} wt%, Na₂O ${Na2O.toFixed(1)} wt%)`,
        warnings: lakatosResult.warnings,
      };
    }

    // 5. Fluegel 2007 — broad silicate glass
    return {
      primary: ViscosityModel.FLUEGEL_2007,
      reason: lakatosResult.reason ?? 'Outside Lakatos range — using Fluegel 2007 broad silicate model',
      warnings: lakatosResult.warnings,
    };
  }

  // ─── Lakatos 1976 regression ────────────────────────────────────────────────

  /**
   * Predict three isokom temperatures using the Lakatos 1976 regression.
   * Returns temperatures in °C at log η = 1, 3, 5 Pa·s
   * (converted from the Lakatos poise levels 2, 4, 6 by subtracting 1).
   *
   * Algorithm from docs/algorithms/glass-viscosity-v2/chapter-04-lakatos-1976.md
   */
  predictIsokomsLakatos(comp: Record<string, number>): LakatosIsokoms {
    const SiO2 = comp['SiO2'] ?? 0;
    if (SiO2 <= 0) {
      throw new BadRequestException('Lakatos model requires SiO₂ > 0 wt%');
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

    const c = LAKATOS_1976_COEFFICIENTS;
    const co = c.components;

    /** Evaluate one isokom level. v = 'v2' | 'v4' | 'v6' */
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

    const T_v2 = evalLevel('v2'); // log η = 2 poise = 1 Pa·s
    const T_v4 = evalLevel('v4'); // log η = 4 poise = 3 Pa·s
    const T_v6 = evalLevel('v6'); // log η = 6 poise = 5 Pa·s

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

    checkBound('SiO₂',  SiO2,            b.SiO2.min,  b.SiO2.max);
    checkBound('Na₂O',  comp['Na2O'] ?? 0, b.Na2O.min,  b.Na2O.max);
    checkBound('Al₂O₃', comp['Al2O3'] ?? 0, b.Al2O3.min, b.Al2O3.max);
    checkBound('K₂O',   comp['K2O'] ?? 0,  b.K2O.min,   b.K2O.max);
    checkBound('Li₂O',  comp['Li2O'] ?? 0, b.Li2O.min,  b.Li2O.max);
    if ((comp['CaO'] ?? 0) > 0) {
      checkBound('CaO', comp['CaO'] ?? 0, b.CaO.min, b.CaO.max);
    }
    checkBound('MgO',  comp['MgO'] ?? 0,  b.MgO.min,  b.MgO.max);
    checkBound('BaO',  comp['BaO'] ?? 0,  b.BaO.min,  b.BaO.max);
    checkBound('ZnO',  comp['ZnO'] ?? 0,  b.ZnO.min,  b.ZnO.max);
    checkBound('PbO',  comp['PbO'] ?? 0,  b.PbO.min,  b.PbO.max);
    checkBound('B₂O₃', comp['B2O3'] ?? 0, b.B2O3.min, b.B2O3.max);

    // Warn about non-Lakatos components
    const lakatosSet = new Set(['SiO2','Al2O3','Na2O','K2O','Li2O','CaO','MgO','BaO','ZnO','PbO','B2O3']);
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

    return {
      T_logEta1: T_v2,
      T_logEta3: T_v4,
      T_logEta5: T_v6,
      warnings,
    };
  }

  // ─── Fluegel 2007 regression ────────────────────────────────────────────────

  /**
   * Predict three isokom temperatures using the Fluegel 2007 polynomial regression.
   * Returns temperatures in °C at log η = 1.5, 6.6, 12.0 Pa·s.
   *
   * Algorithm from docs/algorithms/glass-viscosity-v2/chapter-05-fluegel-2007.md
   */
  predictIsokomsFluegel(comp: Record<string, number>): FluegelIsokoms {
    const molPct = this.wtPctToMolPct(comp);
    const C = (k: string) => molPct[k] ?? 0;

    const evalTable = (
      tbl: typeof FLUEGEL_2007_T1_5 | typeof FLUEGEL_2007_T6_6 | typeof FLUEGEL_2007_T12,
    ): number => {
      let T = tbl.constant;

      // Linear terms
      for (const [k, coeff] of Object.entries(tbl.linear)) {
        T += coeff * C(k);
      }

      // Quadratic self-interaction terms
      for (const [k, coeff] of Object.entries(tbl.quadratic)) {
        T += coeff * C(k) ** 2;
      }

      // Cubic self-interaction terms
      for (const [k, coeff] of Object.entries(tbl.cubic)) {
        T += coeff * C(k) ** 3;
      }

      // Pairwise cross-product terms  (keys like 'Na2O*K2O')
      for (const [key, coeff] of Object.entries(tbl.cross)) {
        const [a, b] = key.split('*');
        T += coeff * C(a) * C(b);
      }

      // Triple cross-product terms  (keys like 'Al2O3*Na2O*CaO')
      for (const [key, coeff] of Object.entries(tbl.cross3)) {
        const [a, b, cc] = key.split('*');
        T += coeff * C(a) * C(b) * C(cc);
      }

      return T;
    };

    const T_1_5 = evalTable(FLUEGEL_2007_T1_5);
    const T_6_6 = evalTable(FLUEGEL_2007_T6_6);
    const T_12  = evalTable(FLUEGEL_2007_T12);

    // Validity warnings against Fluegel table 3 bounds
    const warnings: string[] = [];
    const SiO2Mol = molPct['SiO2'] ?? 0;
    if (SiO2Mol < FLUEGEL_2007_BOUNDS.SiO2_min) {
      warnings.push(`SiO₂ = ${SiO2Mol.toFixed(1)} mol% < Fluegel minimum (${FLUEGEL_2007_BOUNDS.SiO2_min})`);
    }
    if (SiO2Mol > FLUEGEL_2007_BOUNDS.SiO2_max) {
      warnings.push(`SiO₂ = ${SiO2Mol.toFixed(1)} mol% > Fluegel maximum (${FLUEGEL_2007_BOUNDS.SiO2_max})`);
    }

    // Check each bounded component against the most restrictive (6.6 Pa·s) bound
    const boundKeys = Object.keys(FLUEGEL_2007_BOUNDS).filter(
      k => k !== 'SiO2_min' && k !== 'SiO2_max',
    ) as (keyof typeof FLUEGEL_2007_BOUNDS)[];

    for (const k of boundKeys) {
      const maxArr = FLUEGEL_2007_BOUNDS[k] as unknown as number[];
      const maxAt6_6 = maxArr[1];
      const val = molPct[k as string] ?? 0;
      if (val > maxAt6_6 && maxAt6_6 > 0) {
        warnings.push(
          `${k} = ${val.toFixed(2)} mol% exceeds Fluegel maximum at log η 6.6 (${maxAt6_6} mol%)`,
        );
      }
    }

    return { T_logEta1_5: T_1_5, T_logEta6_6: T_6_6, T_logEta12: T_12, warnings };
  }

  // ─── VTF three-point analytical fit ────────────────────────────────────────

  /**
   * Fit VTF parameters analytically from exactly three (T, log η) pairs.
   *
   * Formula: log₁₀(η [Pa·s]) = A + B / (T [°C] − T₀)
   *
   * Uses the determinant form for T₀ (numerically stable):
   *   T₀ = (T₂T₃(y₂−y₃) + T₁T₃(y₃−y₁) + T₁T₂(y₁−y₂))
   *        / (T₃(y₂−y₃) + T₁(y₃−y₁) + T₂(y₁−y₂))
   *
   * Specification: docs/algorithms/glass-viscosity-v2/chapter-07-vtf-fitting.md
   */
  fitVtfThreePoints(p1: VtfPoint, p2: VtfPoint, p3: VtfPoint): VtfParameters {
    // Sort descending temperature so T1 > T2 > T3, y1 < y2 < y3
    const pts = [p1, p2, p3].sort((a, b) => b.T_celsius - a.T_celsius);
    const [q1, q2, q3] = pts;
    const T1 = q1.T_celsius, y1 = q1.logEtaPaS;
    const T2 = q2.T_celsius, y2 = q2.logEtaPaS;
    const T3 = q3.T_celsius, y3 = q3.logEtaPaS;

    // Derive T₀ by eliminating A and then B from the three VTF equations.
    //
    // Starting from:
    //   y1 = A + B/(T1−T0)
    //   y2 = A + B/(T2−T0)
    //   y3 = A + B/(T3−T0)
    //
    // Subtracting eq1 from eq2 and eq1 from eq3:
    //   (y2−y1) = B · (T1−T2) / [(T2−T0)(T1−T0)]
    //   (y3−y1) = B · (T1−T3) / [(T3−T0)(T1−T0)]
    //
    // Dividing to eliminate B:
    //   R = (y2−y1)/(y3−y1) = (T1−T2)(T3−T0) / [(T2−T0)(T1−T3)]
    //
    // Solving the resulting linear equation in T₀:
    //   T₀ = [(T1−T2)·T3 − R·(T1−T3)·T2] / [(T1−T2) − R·(T1−T3)]
    const R = (y2 - y1) / (y3 - y1);
    const num = (T1 - T2) * T3 - R * (T1 - T3) * T2;
    const den = (T1 - T2)       - R * (T1 - T3);

    if (Math.abs(den) < 1e-10) {
      throw new Error(
        'VTF_FIT_SINGULAR: three isokom points are collinear — composition may be outside model range',
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

    // Solve B from eq1 and eq2 (exact for all three by construction)
    const B = (y2 - y1) * (T2 - T0) * (T1 - T0) / (T1 - T2);

    if (B <= 0) {
      throw new Error(
        `VTF_FIT_INVALID_B: B = ${B.toFixed(1)} K is non-physical (must be > 0)`,
      );
    }

    // Solve A from eq1
    const A = y1 - B / (T1 - T0);

    return { A, B, T0 };
  }

  /**
   * Evaluate VTF at a given temperature.
   * log₁₀(η [Pa·s]) = A + B / (T − T₀)   where T is in °C.
   */
  evalVtf(vtf: VtfParameters, T_celsius: number): number {
    const denom = T_celsius - vtf.T0;
    if (Math.abs(denom) < 1) {
      // Near T₀ the VTF diverges — clamp to log η = 15
      return 15;
    }
    return vtf.A + vtf.B / denom;
  }

  /**
   * Invert VTF: temperature at a target log₁₀(η) level.
   * T = B / (log η − A) + T₀
   */
  temperatureAtLogViscosity(vtf: VtfParameters, targetLogEta: number): number {
    const denom = targetLogEta - vtf.A;
    if (Math.abs(denom) < 1e-10) {
      throw new Error(
        `Target log η = ${targetLogEta} equals A = ${vtf.A.toFixed(3)} — viscosity is asymptotically unreachable`,
      );
    }
    return vtf.B / denom + vtf.T0;
  }

  // ─── Hetherington 1964 (pure silica) ───────────────────────────────────────

  private calculateHetherington(
    comp: Record<string, number>,
    temperature: number,
    selection: ModelSelectionResult,
  ): GlassViscosityResult {
    const h = HETHERINGTON_1964;

    // log₁₀(η [Pa·s]) = A + B / T_K
    const T_K = temperature + 273.15;
    const logViscosity = h.A + h.B / T_K;
    const viscosity_Pas = Math.max(1e-3, Math.min(1e15, Math.pow(10, logViscosity)));

    // Fixed points via Arrhenius inversion: T_K = B / (log η − A) → T_C = T_K − 273.15
    const tFromLogEta = (logEta: number) => h.B / (logEta - h.A) - 273.15;

    const fp: FixedPoints = {
      meltingPoint_C:   tFromLogEta(1.0),
      flowPoint_C:      tFromLogEta(4.0),
      workingPoint_C:   tFromLogEta(3.0),
      softeningPoint_C: tFromLogEta(6.6),
      annealingPoint_C: tFromLogEta(12.0),
      strainPoint_C:    tFromLogEta(13.5),
    };
    fp.spans = {
      meltingToStrain_C:       fp.meltingPoint_C   - fp.strainPoint_C,
      workingToSoftening_C:    fp.workingPoint_C   - fp.softeningPoint_C,
      softeningToAnnealing_C:  fp.softeningPoint_C - fp.annealingPoint_C,
      annealingToStrain_C:     fp.annealingPoint_C - fp.strainPoint_C,
    };

    const validation = this.buildValidationStatus(ViscosityModel.HETHERINGTON_1964, selection.warnings);

    const modelInfo: ModelInfo = {
      type: ViscosityModelType.ARRHENIUS,
      systemType: ViscosityModel.HETHERINGTON_1964,
      systemName: ViscosityModelNames[ViscosityModel.HETHERINGTON_1964],
      parameters: {
        A: h.A,
        B: h.B,
        temperatureRange: { min_C: h.temperatureRange.min, max_C: h.temperatureRange.max },
      },
    };

    const metadata: GlassViscosityMetadata = {
      calculatedAt: new Date(),
      modelType: ViscosityModelType.ARRHENIUS,
      standard: 'ASTM_C965_96',
      confidence: validation.confidenceLevel,
      reference: h.reference,
      version: this.VERSION,
    };

    return {
      viscosity_Pas: Number(viscosity_Pas.toFixed(4)),
      temperature_C: temperature,
      logViscosity: Number(Math.log10(viscosity_Pas).toFixed(3)),
      model: modelInfo,
      fixedPoints: fp,
      validation,
      components: this.buildComponentBreakdown(comp),
      composition: comp,
      metadata,
    };
  }

  // ─── Fixed-point helpers ────────────────────────────────────────────────────

  private calculateFixedPointsFromVtf(vtf: VtfParameters): FixedPoints {
    const T = (logEta: number) => this.temperatureAtLogViscosity(vtf, logEta);

    const fp: FixedPoints = {
      meltingPoint_C:   T(1.0),
      workingPoint_C:   T(3.0),
      flowPoint_C:      T(4.0),
      softeningPoint_C: T(6.6),
      annealingPoint_C: T(12.0),
      strainPoint_C:    T(13.5),
    };

    fp.spans = {
      meltingToStrain_C:       fp.meltingPoint_C   - fp.strainPoint_C,
      workingToSoftening_C:    fp.workingPoint_C   - fp.softeningPoint_C,
      softeningToAnnealing_C:  fp.softeningPoint_C - fp.annealingPoint_C,
      annealingToStrain_C:     fp.annealingPoint_C - fp.strainPoint_C,
    };

    return fp;
  }

  private validateFixedPointOrdering(fp: FixedPoints): string[] {
    const warnings: string[] = [];
    if (fp.strainPoint_C >= fp.annealingPoint_C) {
      warnings.push(`ORDERING_VIOLATION: strain (${fp.strainPoint_C.toFixed(0)}°C) ≥ annealing (${fp.annealingPoint_C.toFixed(0)}°C)`);
    }
    if (fp.annealingPoint_C >= fp.softeningPoint_C) {
      warnings.push(`ORDERING_VIOLATION: annealing (${fp.annealingPoint_C.toFixed(0)}°C) ≥ softening (${fp.softeningPoint_C.toFixed(0)}°C)`);
    }
    if (fp.softeningPoint_C >= fp.workingPoint_C) {
      warnings.push(`ORDERING_VIOLATION: softening (${fp.softeningPoint_C.toFixed(0)}°C) ≥ working (${fp.workingPoint_C.toFixed(0)}°C)`);
    }
    if (fp.workingPoint_C >= fp.meltingPoint_C) {
      warnings.push(`ORDERING_VIOLATION: working (${fp.workingPoint_C.toFixed(0)}°C) ≥ melting (${fp.meltingPoint_C.toFixed(0)}°C)`);
    }
    return warnings;
  }

  // ─── Composition utilities ──────────────────────────────────────────────────

  /**
   * Normalise wt% composition so values sum to 100.
   */
  private normalizeComposition(composition: Record<string, number>): Record<string, number> {
    const total = Object.values(composition).reduce((s, v) => s + (v ?? 0), 0);
    if (total === 0) {
      throw new BadRequestException('Composition cannot be all zeros');
    }
    if (Math.abs(total - 100) < 0.01) return { ...composition };
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(composition)) {
      if (v > 0) out[k] = (v / total) * 100;
    }
    return out;
  }

  /**
   * Convert mol% composition to wt% (inverse of wtPctToMolPct).
   * Useful for preparing wt% input from reference data published in mol%
   * (e.g. Fluegel 2007 Table 1).
   */
  molPctToWtPct(molComp: Record<string, number>): Record<string, number> {
    const wtRaw: Record<string, number> = {};
    let totalWt = 0;
    for (const [k, molPct] of Object.entries(molComp)) {
      if (molPct > 0) {
        const M = MOLAR_MASSES[k];
        if (M) {
          const wt = molPct * M;
          wtRaw[k] = wt;
          totalWt += wt;
        }
      }
    }
    const wtPct: Record<string, number> = {};
    for (const [k, wt] of Object.entries(wtRaw)) {
      wtPct[k] = (wt / totalWt) * 100;
    }
    return wtPct;
  }

  /**
   * Convert wt% composition to mol% (full-denominator, SiO₂ included).
   * Used by Fluegel 2007. SiO₂ mol% is returned but NOT passed to regression terms.
   */
  wtPctToMolPct(comp: Record<string, number>): Record<string, number> {
    const moles: Record<string, number> = {};
    let totalMoles = 0;

    for (const [k, wt] of Object.entries(comp)) {
      if (wt > 0) {
        const M = MOLAR_MASSES[k];
        if (M) {
          moles[k] = wt / M;
          totalMoles += moles[k];
        }
        // Unknown components: skip with no moles
      }
    }

    if (totalMoles === 0) return {};

    const molPct: Record<string, number> = {};
    for (const [k, n] of Object.entries(moles)) {
      molPct[k] = (n / totalMoles) * 100;
    }
    return molPct;
  }

  /**
   * Check whether the composition is within Lakatos 1976 validity bounds.
   * Returns { valid: true } if suitable; { valid: false, reason } otherwise.
   */
  private checkLakatosValidity(
    comp: Record<string, number>,
  ): { valid: boolean; reason?: string; warnings: string[] } {
    const SiO2  = comp['SiO2']  ?? 0;
    const Na2O  = comp['Na2O']  ?? 0;
    const b = LAKATOS_1976_COEFFICIENTS.validityBounds;

    const warnings: string[] = [];

    // Hard requirements: SiO₂ range and Na₂O present
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
        reason: `Na₂O = ${Na2O.toFixed(1)} wt% < Lakatos minimum ${b.Na2O.min} wt% (Na₂O must be present)`,
        warnings,
      };
    }
    if (Na2O > b.Na2O.max) {
      warnings.push(`Na₂O = ${Na2O.toFixed(1)} wt% slightly above Lakatos max (${b.Na2O.max} wt%)`);
    }

    // Non-Lakatos components > 5 wt% collectively: use Fluegel instead
    const lakatosSet = new Set(['SiO2','Al2O3','Na2O','K2O','Li2O','CaO','MgO','BaO','ZnO','PbO','B2O3']);
    let outsideWt = 0;
    for (const [k, v] of Object.entries(comp)) {
      if (!lakatosSet.has(k) && v > 0) outsideWt += v;
    }
    if (outsideWt > 5) {
      return {
        valid: false,
        reason: `${outsideWt.toFixed(1)} wt% of composition is outside Lakatos component list — Fluegel 2007 covers more components`,
        warnings,
      };
    }

    // Soft checks on individual component bounds (warn but don't disqualify)
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

  // ─── Validation ─────────────────────────────────────────────────────────────

  private buildValidationStatus(
    modelType: ViscosityModel,
    warnings: string[],
  ): ValidationStatus {
    // Determine confidence from warning count and content
    let confidenceLevel = ConfidenceLevel.HIGH;
    let extrapolationRisk = ExtrapolationRisk.NONE;
    const compositionIssues: CompositionIssue[] = [];

    const hasOrdering = warnings.some(w => w.startsWith('ORDERING_VIOLATION'));
    const outOfRange   = warnings.filter(w =>
      w.includes('outside') || w.includes('exceeds') || w.includes('above') || w.includes('below'),
    ).length;

    if (hasOrdering) {
      confidenceLevel = ConfidenceLevel.LOW;
      extrapolationRisk = ExtrapolationRisk.SEVERE;
    } else if (outOfRange >= 3) {
      confidenceLevel = ConfidenceLevel.LOW;
      extrapolationRisk = ExtrapolationRisk.MODERATE;
    } else if (outOfRange >= 1) {
      confidenceLevel = ConfidenceLevel.MEDIUM;
      extrapolationRisk = ExtrapolationRisk.MINOR;
    }

    return {
      systemDetected: ViscosityModelNames[modelType],
      confidenceLevel,
      warnings,
      componentsInRange: 0,   // not counting per-component here; see isokom warnings
      componentsOutOfRange: outOfRange,
      extrapolationRisk,
      compositionIssues,
    };
  }

  // ─── Component breakdown ────────────────────────────────────────────────────

  private buildComponentBreakdown(comp: Record<string, number>): ComponentBreakdown {
    const formersList   = new Set(['SiO2','Al2O3','Cr2O3','ZrO2','TiO2','B2O3','GeO2','P2O5']);
    const modifiersList = new Set(['Na2O','K2O','Li2O','PbO','CaO','BaO','SrO','MnO','FeO','Fe2O3','CoO','NiO','CuO','MgO','ZnO','MnO2']);
    const fluoridesList = new Set(['NaF','KF','LiF','CaF2','MgF2','AlF3','F']);
    const chloridesList = new Set(['NaCl','KCl','CaCl2','MgCl2','FeCl2','FeCl3']);

    const networkFormers: ComponentEffect[] = [];
    const networkModifiers: ComponentEffect[] = [];
    const fluorides: ComponentEffect[] = [];
    const chlorides: ComponentEffect[] = [];

    for (const [component, percentage] of Object.entries(comp)) {
      if (percentage <= 0) continue;
      const effect = getComponentEffect(component)?.viscosityEffect ?? 0;
      const entry: ComponentEffect = { component, percentage, effect };

      if (formersList.has(component))   networkFormers.push(entry);
      else if (modifiersList.has(component)) networkModifiers.push(entry);
      else if (fluoridesList.has(component)) fluorides.push(entry);
      else if (chloridesList.has(component)) chlorides.push(entry);
    }

    return { networkFormers, networkModifiers, fluorides, chlorides };
  }
}

