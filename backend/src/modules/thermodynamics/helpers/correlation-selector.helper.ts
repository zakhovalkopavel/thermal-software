import { DimensionlessInputDto } from '../dto/dimensionless-input.dto';
import { GeometryDimsDto } from '../dto/geometry-dims.dto';
import { CorrelationName } from '../enums/correlation-name.enum';
import { CorrelationFamily } from '../enums/correlation-family.enum';
import { CORRELATION_NAME_TO_FAMILY } from '../constants/correlation-families.constant';
import { FlowGeometry } from '../enums/flow-geometry.enum';
import { FlowRegime } from '../types/flow-regime.type';
import { ResolvedDimensionlessPropsDto } from '../dto/resolved-dimensionless-props.dto';
import { CORRELATION_VALIDITY } from './correlation-validity.helper';
import { pipeDuctNu } from './nu-formulas/pipe-duct.nu';
import { flatPlateNu } from './nu-formulas/flat-plate.nu';
import { cylinderNu } from './nu-formulas/cylinder.nu';
import { sphereNu } from './nu-formulas/sphere.nu';
import { tubeBankNu } from './nu-formulas/tube-bank.nu';
import { naturalConvectionNu } from './nu-formulas/natural-convection.nu';
import { specialNu } from './nu-formulas/special.nu';

/**
 * Routes a CorrelationName to its Nu-formula implementation.
 *
 * Static-method class (not injectable) — owns only pure routing logic.
 * No state; no side effects.  All callers use CorrelationSelectorHelper.run()
 * or CorrelationSelectorHelper.compute() instead of the previous three exports.
 */
export class CorrelationSelectorHelper {

  /**
   * Run a single named Nu correlation, return Nu + range validity.
   *
   * @param corr    Correlation to evaluate.
   * @param resolved  Pre-resolved dimensionless properties (all mandatory).
   * @param params  Original DTO — needed for geometry dims and control flags.
   * @param regime  Pre-resolved flow regime.
   */
  static run(
    corr: CorrelationName,
    resolved: ResolvedDimensionlessPropsDto,
    params: DimensionlessInputDto,
    regime: FlowRegime,
  ): { Nu: number; rangeValid: boolean; warning?: string } {
    const v = CORRELATION_VALIDITY[corr];
    let warning: string | undefined;
    let rangeValid = true;
    if (v?.Re && (resolved.Re < v.Re[0] || resolved.Re > v.Re[1])) {
      rangeValid = false;
      warning = `Re=${resolved.Re.toFixed(0)} outside [${v.Re[0]},${v.Re[1]}]`;
    }
    if (v?.Pr && (resolved.Pr < v.Pr[0] || resolved.Pr > v.Pr[1])) {
      rangeValid = false;
      warning = (warning ? warning + '; ' : '') + `Pr outside range`;
    }
    if (v?.Ra && (resolved.Ra < v.Ra[0] || resolved.Ra > v.Ra[1])) {
      rangeValid = false;
      warning = (warning ? warning + '; ' : '') + `Ra outside range`;
    }
    const Nu = CorrelationSelectorHelper.compute(corr, resolved, params, regime);
    return { Nu, rangeValid, warning };
  }

  /**
   * Route a correlation to the appropriate Nu formula helper.
   * Dispatches via CorrelationFamily enum — no raw string sets.
   *
   * @param corr    Correlation to evaluate.
   * @param resolved  Pre-resolved dimensionless properties (all mandatory).
   * @param params  Original DTO — needed for geometry dims and control flags.
   * @param regime  Pre-resolved flow regime.
   */
  static compute(
    corr: CorrelationName,
    resolved: ResolvedDimensionlessPropsDto,
    params: DimensionlessInputDto,
    regime: FlowRegime,
  ): number {
    const { Re, Pr, Ra, mu_f, nu_f } = resolved;
    // mu_f = dynamic viscosity at bulk temperature — resolved from fluid state (Mode B).
    // For wall-correction correlations (Sieder-Tate, Whitaker) the wall-temperature
    // viscosity mu_s is not available from Mode B; use mu_f as a conservative fallback
    // (ratio = 1, no correction). This is physically correct for gases with small ΔT.
    const mu_s      = mu_f;
    const dims      = (params.dims ?? {}) as GeometryDimsDto;
    const D         = (dims.a ?? 0.05) * 2;
    const isHeating = params.isHeating !== false;

    const family = CORRELATION_NAME_TO_FAMILY[corr];

    switch (family) {
      case CorrelationFamily.PipeDuct:
        return pipeDuctNu.compute(corr, dims, mu_f, mu_s, isHeating, Re, Pr, regime);
      case CorrelationFamily.FlatPlate:
        return flatPlateNu.compute(corr, Re, Pr, mu_f, mu_s);
      case CorrelationFamily.Cylinder:
        return cylinderNu.compute(corr, Re, Pr, mu_f, mu_s);
      case CorrelationFamily.Sphere:
        return sphereNu.compute(corr, Re, Pr, mu_f, mu_s);
      case CorrelationFamily.TubeBank:
        return tubeBankNu.compute(corr, Re, Pr, mu_f, mu_s, dims, params.geometry);
      case CorrelationFamily.NaturalConvection:
        return naturalConvectionNu.compute(corr, Re, Pr, Ra, dims);
      case CorrelationFamily.Special:
        return specialNu.compute(corr, Re, Pr, mu_f, mu_s, dims, D, nu_f);
      default:
        throw new Error(`Unknown correlation family for: ${corr}`);
    }
  }

  /** Select the best correlation for a given geometry and regime. */
  static best(
    geo: FlowGeometry,
    Re: number,
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
        if (regime === FlowRegime.NATURAL)      return CorrelationName.ChurchillChu;
        if (regime === FlowRegime.LAMINAR)      return CorrelationName.Mills;
        if (regime === FlowRegime.TRANSITIONAL) return Re < 3000 ? CorrelationName.Transitional : CorrelationName.Gnielinski;
        return CorrelationName.Gnielinski;
      case FlowGeometry.CYLINDER_CROSSFLOW:
        return CorrelationName.ChurchillBernstein;
      case FlowGeometry.SPHERE_FORCED:
        return params.isDiffusion ? CorrelationName.SphereDiffusion : CorrelationName.SphereRanzMarshall;
      case FlowGeometry.FLAT_PLATE:
      case FlowGeometry.FLAT_PLATE_ROUGH:
        return Re <= 5e5 ? CorrelationName.FlatPlateLaminar : CorrelationName.FlatPlateMixed;
      case FlowGeometry.TUBE_BANK_INLINE:
      case FlowGeometry.TUBE_BANK_STAGGERED:
        return CorrelationName.Zukauskas;
      case FlowGeometry.VERTICAL_PLATE:
      case FlowGeometry.VERTICAL_CYLINDER:
        return CorrelationName.ChurchillChu;
      case FlowGeometry.HORIZONTAL_CYLINDER:
        return CorrelationName.Morgan;
      case FlowGeometry.HORIZONTAL_PLATE_HOT_UP:
        return CorrelationName.McAdamsHotUp;
      case FlowGeometry.HORIZONTAL_PLATE_HOT_DOWN:
        return CorrelationName.McAdamsHotDown;
      case FlowGeometry.INCLINED_PLATE:
        return CorrelationName.ChurchillInclined;
      case FlowGeometry.SPHERE_NATURAL:
        return CorrelationName.ChurchillSphereNatural;
      case FlowGeometry.CONCENTRIC_CYLINDERS:
        return CorrelationName.RaithbyHollandsCylinders;
      case FlowGeometry.CONCENTRIC_SPHERES:
        return CorrelationName.RaithbyHollandsSpheres;
      case FlowGeometry.HORIZONTAL_CAVITY:
        return CorrelationName.Hollands;
      case FlowGeometry.VERTICAL_CAVITY:
        return CorrelationName.MacGregorEmery;
      case FlowGeometry.MIXED_PIPE_VERTICAL:
      case FlowGeometry.MIXED_PLATE_VERTICAL:
        return CorrelationName.MixedPowerSum;
      case FlowGeometry.PACKED_BED:
      case FlowGeometry.PACKED_BED_CYLINDER:
        return Re > 1e5 || (params.dims?.epsilon ?? 0.4) < 0.35
          ? CorrelationName.WakaoFunazkri : CorrelationName.Gunn;
      case FlowGeometry.HELICAL_COIL:
        return CorrelationName.SebanMcLaughlin;
      case FlowGeometry.CORRUGATED_PIPE:
      case FlowGeometry.RIBBED_CHANNEL:
        return CorrelationName.WebbEckertGoldstein;
      case FlowGeometry.ELLIPTICAL_CYLINDER:
        return CorrelationName.EllipticalCylinderOwen;
      case FlowGeometry.CONE_CROSSFLOW:
        return CorrelationName.ConeYuge;
      case FlowGeometry.CONDENSATION_VERTICAL_PLATE:
      case FlowGeometry.CONDENSATION_HORIZONTAL_TUBE:
        return CorrelationName.NusseltCondensation;
      case FlowGeometry.ROTATING_DISK:
        return CorrelationName.DorfmanDisk;
      case FlowGeometry.ROTATING_CYLINDER:
        return CorrelationName.BjorklundKays;
      case FlowGeometry.IMPINGING_JET_SINGLE:
        return CorrelationName.MartinJetSingle;
      case FlowGeometry.IMPINGING_JET_ARRAY:
        return CorrelationName.MartinJetArray;
      default:
        return CorrelationName.Gnielinski;
    }
  }
}
