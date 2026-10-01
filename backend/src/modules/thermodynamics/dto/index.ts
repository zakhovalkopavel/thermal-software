// ── Gas properties ────────────────────────────────────────────────────────────
export { GasMixtureInputDto } from './gas-properties/gas-mixture-input.dto';
export { GasPropertiesResultDto } from './gas-properties/gas-properties-result.dto';
export { CpComparisonEntryDto } from './gas-properties/cp-comparison-entry.dto';

// ── Fluid property inputs ─────────────────────────────────────────────────────
export { FluidBaseInputDto } from './fluid/fluid-base-input.dto';

// ── Geometry ──────────────────────────────────────────────────────────────────
export { GeometryDimsDto } from './geometry/geometry-dims.dto';
export { BodyGeometryInputDto } from './geometry/body-geometry-input.dto';
export { BodyGeometryResultDto } from './geometry/body-geometry-result.dto';

// ── Dimensionless numbers (full set) ──────────────────────────────────────────
export { DimensionlessInputDto } from './dimensionless/dimensionless-input.dto';
export { DimensionlessResultDto } from './dimensionless/dimensionless-result.dto';
export { ResolvedDimensionlessPropsDto } from './dimensionless/resolved-dimensionless-props.dto';

// ── Scalar dimensionless numbers ──────────────────────────────────────────────
export { FluidStateDto } from './dimensionless/fluid-state.dto';
export { ReynoldsInputDto } from './dimensionless/reynolds-input.dto';
export { PrandtlInputDto } from './dimensionless/prandtl-input.dto';
export { GrashofInputDto } from './dimensionless/grashof-input.dto';
export { RayleighInputDto } from './dimensionless/rayleigh-input.dto';
export { HeatTransferCoefficientDto } from './dimensionless/heat-transfer-coefficient.dto';
export { ScalarDimensionlessResultDto } from './dimensionless/scalar-dimensionless-result.dto';

// ── Numeric (root finding, optimisation, regression) ─────────────────────────
export { BrentqInputDto } from './numeric/brentq-input.dto';
export { XYInputDto } from './numeric/xy-input.dto';
export { PolynomialFitInputDto } from './numeric/polynomial-fit-input.dto';
export { LevenbergMarquardtInputDto } from './numeric/levenberg-marquardt-input.dto';
export { NelderMeadInputDto } from './numeric/nelder-mead-input.dto';

// ── Types re-exported for convenience ────────────────────────────────────────
export { CorrelationName } from '../types/correlation-name.type';
export { KnownFluid } from '../types/known-fluid.type';
export { FlowRegime } from '../types/flow-regime.type';
