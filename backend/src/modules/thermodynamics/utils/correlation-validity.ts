import { FlowGeometry } from '../enums/flow-geometry.enum';
import { FlowRegime } from '../types/flow-regime.type';
import { CorrelationName } from '../enums/correlation-name.enum';
import { CORRELATION_VALIDITY } from '../constants/correlation-validity.constants';

/**
 * Correlation applicability helpers (geometry / Re / Pr / Ra) and regime resolution.
 * Stateless — no DI.
 */
export class CorrelationValidity {
  /** All correlations valid for a given geometry */
  static availableCorrelations(geo: FlowGeometry): CorrelationName[] {
    return (Object.keys(CORRELATION_VALIDITY) as CorrelationName[])
      .filter(k => CORRELATION_VALIDITY[k]?.geometries.includes(geo));
  }

  /**
   * Determine flow regime from geometry, Re and Ra.
   * Optional `forced` value takes priority.
   *
   * Re = 0 means no forced flow (w_m_s = 0) → NATURAL convection is selected
   * for geometries that support it; otherwise falls back to LAMINAR.
   */
  static resolveRegime(
    geo: FlowGeometry,
    Re: number,
    Ra: number,
    forced?: FlowRegime,
  ): FlowRegime {
    if (forced) return forced;
    const naturalGeos: FlowGeometry[] = [
      FlowGeometry.VERTICAL_PLATE, FlowGeometry.VERTICAL_CYLINDER,
      FlowGeometry.HORIZONTAL_CYLINDER, FlowGeometry.HORIZONTAL_PLATE_HOT_UP,
      FlowGeometry.HORIZONTAL_PLATE_HOT_DOWN, FlowGeometry.INCLINED_PLATE,
      FlowGeometry.SPHERE_NATURAL, FlowGeometry.CONCENTRIC_CYLINDERS,
      FlowGeometry.CONCENTRIC_SPHERES, FlowGeometry.HORIZONTAL_CAVITY,
      FlowGeometry.VERTICAL_CAVITY,
    ];
    if (naturalGeos.includes(geo)) return FlowRegime.NATURAL;
    if (geo === FlowGeometry.MIXED_PIPE_VERTICAL || geo === FlowGeometry.MIXED_PLATE_VERTICAL)
      return FlowRegime.MIXED;
    if (Re === 0) return Ra > 0 ? FlowRegime.NATURAL : FlowRegime.LAMINAR;
    if (Re < 2300)  return FlowRegime.LAMINAR;
    if (Re < 4000)  return FlowRegime.TRANSITIONAL;
    return FlowRegime.TURBULENT;
  }

  /**
   * Validate whether a preferred correlation is applicable.
   * Returns null if valid, or a rejection reason string.
   */
  static validatePreferredCorrelation(
    corr: CorrelationName,
    geo: FlowGeometry,
    Re: number | undefined,
    Pr: number | undefined,
    Ra: number | undefined,
  ): string | null {
    const v = CORRELATION_VALIDITY[corr];
    if (!v) return `correlation '${corr}' unknown`;
    if (!v.geometries.includes(geo)) return `not applicable to geometry ${geo}`;
    if (v.Re && Re !== undefined && (Re < v.Re[0] || Re > v.Re[1]))
      return `Re=${Re.toFixed(0)} outside range [${v.Re[0]},${v.Re[1]}]`;
    if (v.Pr && Pr !== undefined && (Pr < v.Pr[0] || Pr > v.Pr[1]))
      return `Pr=${Pr.toFixed(3)} outside range [${v.Pr[0]},${v.Pr[1]}]`;
    if (v.Ra && Ra !== undefined && (Ra < v.Ra[0] || Ra > v.Ra[1]))
      return `Ra=${Ra.toExponential(2)} outside range [${v.Ra[0]},${v.Ra[1]}]`;
    return null;
  }
}
