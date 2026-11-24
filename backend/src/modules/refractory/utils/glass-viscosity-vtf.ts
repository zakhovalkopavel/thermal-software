/**
 * VTF fit / evaluate / fixed-point helpers and model dispatch (`buildVtf`).
 * Stateless — no DI.
 */
import { levenbergMarquardt } from '../../../common/utils/regression';
import type {
  FixedPoints,
  ModelSelectionResult,
  VtfParameters,
  VtfPoint,
} from '../types';
import { calculateFixedPoints } from './calculate-fixed-points.util';
import { LAKATOS_1976_DIRECT_VTF_COEFFICIENTS } from '../data/viscosity-parameters.data';
import { ViscosityModel } from '../enums/viscosity-model.enum';
import { GlassViscosityLakatos } from './glass-viscosity-lakatos';
import { GlassViscosityFluegel } from './glass-viscosity-fluegel';

export class GlassViscosityVtf {
  /**
   * Build a VTF curve for the given composition using the model indicated in
   * `selection.primary` (must be LAKATOS_1976 or FLUEGEL_2007).
   *
   * For LAKATOS_1976 the **direct VTF approach** (Table 6) is used:
   *   composition → B, A, T₀ via single linear regression → VTF curve
   *   This is the primary production path.
   *
   *   The two-stage isokom approach (Table 7: composition → 3 isokom temperatures
   *   → VTF fit) is available separately via predictIsokomsLakatos() and is
   *   intentionally kept for component-effect analysis and illustration purposes:
   *   "Although the factors for calculating the temperatures for different
   *    viscosity levels are only an intermediate step, it is of interest to
   *    study the effects of different oxides on temperature at different
   *    viscosity levels." (Lakatos 1976)
   *
   * @param comp       Normalised wt% composition
   * @param selection  Resolved model selection (primary must be a VTF model)
   * @returns          VTF parameters, bibliographic reference, and warnings
   */
  static buildVtf(
    comp: Record<string, number>,
    selection: ModelSelectionResult,
  ): { vtf: VtfParameters; modelRef: string; isokomWarnings: string[] } {
    if (selection.primary === ViscosityModel.LAKATOS_1976) {
      const { vtf, warnings } = GlassViscosityLakatos.predictVtfDirectLakatos(comp);
      return {
        vtf,
        modelRef: LAKATOS_1976_DIRECT_VTF_COEFFICIENTS.reference,
        isokomWarnings: warnings,
      };
    }

    // FLUEGEL_2007
    const iso = GlassViscosityFluegel.predictIsokomsFluegel(comp);
    const vtf = GlassViscosityVtf.fitVtfThreePoints(
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

  /**
   * Fit VTF parameters from exactly three (T, log η) pairs using the
   * Levenberg-Marquardt nonlinear least-squares algorithm.
   *
   * Formula:  log₁₀(η [Pa·s]) = A + B / (T [°C] − T₀)
   *
   * Although the system is exactly determined (3 equations, 3 unknowns), the
   * analytical determinant form suffers from catastrophic cancellation when
   * temperatures are large (~1000 °C) and viscosity differences are small,
   * because intermediate products reach ~10⁹ before subtracting. LM works
   * directly on the residuals in the original scale, avoiding this issue.
   *
   * Initial guess strategy:
   *   - T₀ is seeded at 50°C below the lowest input temperature (physical lower bound)
   *   - B  is seeded from the Arrhenius slope between the two extreme points
   *   - A  is seeded from the VTF equation using T₀ and B
   *
   * Throws VTF_FIT_SINGULAR if the three points are collinear (Arrhenius-like).
   * Throws VTF_FIT_INVALID_T0 / VTF_FIT_INVALID_B if result is non-physical.
   *
   * SciPy equivalent: scipy.optimize.curve_fit(lambda T,(A,B,T0): A+B/(T-T0), ...)
   */
  static fitVtfThreePoints(
    p1: VtfPoint,
    p2: VtfPoint,
    p3: VtfPoint,
  ): VtfParameters {
    // Sort descending T: T1 > T2 > T3, y1 < y2 < y3
    const pts = [p1, p2, p3].sort((a, b) => b.T_celsius - a.T_celsius);
    const [q1, q2, q3] = pts;
    const T1 = q1.T_celsius, y1 = q1.logEtaPaS;
    const T2 = q2.T_celsius;
    const T3 = q3.T_celsius, y3 = q3.logEtaPaS;

    // Seed T₀ well below the lowest measured temperature
    const T0_seed = Math.max(1, T3 * 0.4);

    // Seed B from Arrhenius slope between the two extreme points (approximation)
    const dY = y3 - y1;
    const dInvT = 1 / (T3 - T0_seed) - 1 / (T1 - T0_seed);
    const B_seed = Math.abs(dInvT) > 1e-12 ? dY / dInvT : 5000;

    // Seed A from the VTF equation at point 1
    const A_seed = y1 - B_seed / (T1 - T0_seed);

    const xData = [T1, T2, T3];
    const yData = [q1.logEtaPaS, q2.logEtaPaS, q3.logEtaPaS];

    // VTF model factory: ([A, B, T0]) => (T) => A + B / (T - T0)
    const vtfModel = ([A, B, T0]: number[]) => (T: number) => A + B / (T - T0);

    const fit = levenbergMarquardt(
      xData,
      yData,
      vtfModel,
      [A_seed, B_seed, T0_seed],
      { maxIterations: 1000, damping: 1e-3, gradientDifference: 1e-5 },
    );

    const [A, B, T0] = fit.parameterValues;

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
    if (B <= 0) {
      throw new Error(
        `VTF_FIT_INVALID_B: B = ${B.toFixed(1)} K is non-physical (must be > 0)`,
      );
    }

    // Sanity check: residuals must be small (LM converged properly)
    const maxResidual = Math.max(...xData.map((T, i) => Math.abs(vtfModel([A, B, T0])(T) - yData[i])));
    if (maxResidual > 0.01) {
      throw new Error(
        `VTF_FIT_SINGULAR: LM did not converge — max residual ${maxResidual.toFixed(4)}. ` +
        'Three isokom points may be collinear (Arrhenius-like) or composition is outside model range.',
      );
    }

    return { A, B, T0 };
  }

  /**
   * Forward VTF: temperature → log₁₀(η [Pa·s])
   * Clamps near-T₀ singularity to log η = 15.
   */
  static evalVtf(vtf: VtfParameters, T_celsius: number): number {
    const denom = T_celsius - vtf.T0;
    if (Math.abs(denom) < 1) return 15;
    return vtf.A + vtf.B / denom;
  }

  /**
   * Inverse VTF: target log η → temperature in °C.
   * T = B / (log η − A) + T₀
   */
  static temperatureAtLogViscosity(
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

  /**
   * Calculate all ASTM C965-96 fixed points from a VTF parameter set.
   * Log₁₀(η) targets live in `ASTM_FIXED_POINT_LOG_ETA`; this only
   * supplies the VTF inverse T(log η).
   */
  static calculateFixedPointsFromVtf(vtf: VtfParameters): FixedPoints {
    return calculateFixedPoints(
      (logEta) => GlassViscosityVtf.temperatureAtLogViscosity(vtf, logEta),
    );
  }

}
