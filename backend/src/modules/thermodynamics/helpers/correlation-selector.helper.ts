import { DimensionlessInputDto, CorrelationName } from '../dto/dimensionless.dto';
import { FlowGeometry } from '../enums/flow-geometry.enum';
import { FlowRegime } from '../types/flow-regime.type';
import { CORRELATION_VALIDITY } from './correlation-validity.helper';
import { pipeDuctNu } from './nu-formulas/pipe-duct.nu';
import { flatPlateNu } from './nu-formulas/flat-plate.nu';
import { cylinderNu } from './nu-formulas/cylinder.nu';
import { sphereNu } from './nu-formulas/sphere.nu';
import { tubeBankNu } from './nu-formulas/tube-bank.nu';
import { naturalConvectionNu } from './nu-formulas/natural-convection.nu';
import { specialNu } from './nu-formulas/special.nu';

/** Groups a correlation name to its geometry family */
const PIPE_DUCT_CORRELATIONS = new Set([
  'mills','sieder_tate_laminar','fully_developed_uniform_T','fully_developed_uniform_q',
  'transitional','gnielinski','gnielinski_v2','dittus_boelter','sieder_tate_turbulent',
  'mikheev','petukhov','whitaker_pipe','seban_mclaughlin','webb_eckert_goldstein','isachenko_roughness',
]);
const FLAT_PLATE_CORRELATIONS = new Set([
  'flat_plate_laminar','flat_plate_turbulent','flat_plate_mixed','churchill_ozoe','whitaker_flat_plate',
]);
const CYLINDER_CORRELATIONS = new Set([
  'churchill_bernstein','hilpert','whitaker_cylinder',
]);
const SPHERE_CORRELATIONS = new Set([
  'sphere_ranz_marshall','sphere_diffusion','whitaker_sphere',
]);
const TUBE_BANK_CORRELATIONS = new Set([
  'zukauskas','whitaker_tube_bank',
]);
const NATURAL_CORRELATIONS = new Set([
  'churchill_chu_laminar','churchill_chu_all_ra','churchill_chu',
  'morgan','churchill_chu_horizontal',
  'mcadams_hot_up','mcadams_hot_down',
  'churchill_inclined','churchill_sphere_natural',
  'raithby_hollands_cylinders','raithby_hollands_spheres',
  'hollands','globe_dropkin','macgregor_emery','mixed_power_sum',
]);

/** Run a single named Nu correlation, return Nu + range validity */
export function runCorrelation(
  corr: CorrelationName,
  Re: number | undefined,
  Pr: number | undefined,
  Ra: number | undefined,
  params: DimensionlessInputDto,
  regime: FlowRegime,
): { Nu: number; rangeValid: boolean; warning?: string } {
  const v = CORRELATION_VALIDITY[corr];
  let warning: string | undefined;
  let rangeValid = true;
  if (v?.Re && Re !== undefined && (Re < v.Re[0] || Re > v.Re[1])) {
    rangeValid = false; warning = `Re=${Re.toFixed(0)} outside [${v.Re[0]},${v.Re[1]}]`;
  }
  if (v?.Pr && Pr !== undefined && (Pr < v.Pr[0] || Pr > v.Pr[1])) {
    rangeValid = false; warning = (warning ? warning + '; ' : '') + `Pr outside range`;
  }
  if (v?.Ra && Ra !== undefined && (Ra < v.Ra[0] || Ra > v.Ra[1])) {
    rangeValid = false; warning = (warning ? warning + '; ' : '') + `Ra outside range`;
  }
  const Nu = computeNu(corr, Re, Pr, Ra, params, regime);
  return { Nu, rangeValid, warning };
}

/** Route correlation to the appropriate Nu formula file */
export function computeNu(
  corr: CorrelationName,
  Re: number | undefined,
  Pr: number | undefined,
  Ra: number | undefined,
  params: DimensionlessInputDto,
  regime: FlowRegime,
): number {
  const re   = Re ?? 0;
  const pr   = Pr ?? 0.7;
  const ra   = Ra ?? 0;
  const mu   = params.mu_Pa_s ?? 1e-5;
  const mu_s = params.mu_s_Pa_s ?? mu;
  const dims = params.dims ?? {};
  const D    = (dims.a ?? 0.05) * 2;

  if (PIPE_DUCT_CORRELATIONS.has(corr))
    return pipeDuctNu.compute(corr, params, re, pr, regime);
  if (FLAT_PLATE_CORRELATIONS.has(corr))
    return flatPlateNu.compute(corr, re, pr, mu, mu_s);
  if (CYLINDER_CORRELATIONS.has(corr))
    return cylinderNu.compute(corr, re, pr, mu, mu_s);
  if (SPHERE_CORRELATIONS.has(corr))
    return sphereNu.compute(corr, re, pr, mu, mu_s);
  if (TUBE_BANK_CORRELATIONS.has(corr))
    return tubeBankNu.compute(corr, re, pr, mu, mu_s, params, D);
  if (NATURAL_CORRELATIONS.has(corr))
    return naturalConvectionNu.compute(corr, re, pr, ra, dims);

  // Everything else: special geometries
  return specialNu.compute(corr, re, pr, mu, mu_s, params, D);
}

/** Select the best correlation for a given geometry and regime */
export function bestCorrelation(
  geo: FlowGeometry,
  Re: number | undefined,
  regime: FlowRegime,
  params: DimensionlessInputDto,
): CorrelationName {
  switch (geo) {
    case FlowGeometry.PIPE_CIRCULAR:
    case FlowGeometry.DUCT_SQUARE:
    case FlowGeometry.DUCT_RECTANGULAR:
    case FlowGeometry.DUCT_TRIANGULAR:
    case FlowGeometry.DUCT_TRIANGULAR_SCALENE:
    case FlowGeometry.DUCT_ELLIPTICAL:
    case FlowGeometry.DUCT_TRAPEZOIDAL:
    case FlowGeometry.PIPE_ANNULUS:
    case FlowGeometry.PARALLEL_PLATES:
      if (regime === FlowRegime.NATURAL)      return 'churchill_chu';
      if (regime === FlowRegime.LAMINAR)      return 'mills';
      if (regime === FlowRegime.TRANSITIONAL) return (Re ?? 0) < 3000 ? 'transitional' : 'gnielinski';
      return 'gnielinski';
    case FlowGeometry.CYLINDER_CROSSFLOW:    return 'churchill_bernstein';
    case FlowGeometry.SPHERE_FORCED:         return params.isDiffusion ? 'sphere_diffusion' : 'sphere_ranz_marshall';
    case FlowGeometry.FLAT_PLATE:
    case FlowGeometry.FLAT_PLATE_ROUGH:
      return Re === undefined || Re <= 5e5 ? 'flat_plate_laminar' : 'flat_plate_mixed';
    case FlowGeometry.TUBE_BANK_INLINE:
    case FlowGeometry.TUBE_BANK_STAGGERED:   return 'zukauskas';
    case FlowGeometry.VERTICAL_PLATE:
    case FlowGeometry.VERTICAL_CYLINDER:     return 'churchill_chu';
    case FlowGeometry.HORIZONTAL_CYLINDER:   return 'morgan';
    case FlowGeometry.HORIZONTAL_PLATE_HOT_UP:   return 'mcadams_hot_up';
    case FlowGeometry.HORIZONTAL_PLATE_HOT_DOWN:  return 'mcadams_hot_down';
    case FlowGeometry.INCLINED_PLATE:         return 'churchill_inclined';
    case FlowGeometry.SPHERE_NATURAL:         return 'churchill_sphere_natural';
    case FlowGeometry.CONCENTRIC_CYLINDERS:   return 'raithby_hollands_cylinders';
    case FlowGeometry.CONCENTRIC_SPHERES:     return 'raithby_hollands_spheres';
    case FlowGeometry.HORIZONTAL_CAVITY:      return 'hollands';
    case FlowGeometry.VERTICAL_CAVITY:        return 'macgregor_emery';
    case FlowGeometry.MIXED_PIPE_VERTICAL:
    case FlowGeometry.MIXED_PLATE_VERTICAL:   return 'mixed_power_sum';
    case FlowGeometry.PACKED_BED:
    case FlowGeometry.PACKED_BED_CYLINDER:
      return (Re ?? 0) > 1e5 || (params.dims?.epsilon ?? 0.4) < 0.35
        ? 'wakao_funazkri' : 'gunn';
    case FlowGeometry.HELICAL_COIL:           return 'seban_mclaughlin';
    case FlowGeometry.CORRUGATED_PIPE:
    case FlowGeometry.RIBBED_CHANNEL:         return 'webb_eckert_goldstein';
    case FlowGeometry.ELLIPTICAL_CYLINDER:    return 'elliptical_cylinder_owen';
    case FlowGeometry.CONE_CROSSFLOW:         return 'cone_yuge';
    case FlowGeometry.CONDENSATION_VERTICAL_PLATE:
    case FlowGeometry.CONDENSATION_HORIZONTAL_TUBE: return 'nusselt_condensation';
    case FlowGeometry.ROTATING_DISK:          return 'dorfman_disk';
    case FlowGeometry.ROTATING_CYLINDER:      return 'bjorklund_kays';
    case FlowGeometry.IMPINGING_JET_SINGLE:   return 'martin_jet_single';
    case FlowGeometry.IMPINGING_JET_ARRAY:    return 'martin_jet_array';
    default: return 'gnielinski';
  }
}

