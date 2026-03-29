// ── Gas properties ────────────────────────────────────────────────────────────
export { GasMixtureInputDto } from './gas-mixture-input.dto';
export { GasPropertiesResultDto } from './gas-properties-result.dto';
export { CpComparisonEntryDto } from './cp-comparison-entry.dto';

// ── Fluid property inputs ─────────────────────────────────────────────────────
export { FluidBaseInputDto } from './fluid-base-input.dto';

// ── Geometry ──────────────────────────────────────────────────────────────────
export { GeometryDimsDto } from './geometry-dims.dto';
export { BodyGeometryInputDto } from './body-geometry-input.dto';
export { BodyGeometryResultDto } from './body-geometry-result.dto';

// ── Dimensionless numbers (full set) ──────────────────────────────────────────
export { DimensionlessInputDto } from './dimensionless-input.dto';
export { DimensionlessResultDto } from './dimensionless-result.dto';
export { ResolvedDimensionlessPropsDto } from './resolved-dimensionless-props.dto';

// ── Scalar dimensionless numbers ──────────────────────────────────────────────
export { FluidStateDto } from './fluid-state.dto';
export { ReynoldsInputDto } from './reynolds-input.dto';
export { PrandtlInputDto } from './prandtl-input.dto';
export { GrashofInputDto } from './grashof-input.dto';
export { RayleighInputDto } from './rayleigh-input.dto';
export { HeatTransferCoefficientDto } from './heat-transfer-coefficient.dto';
export { ScalarDimensionlessResultDto } from './scalar-dimensionless-result.dto';

// ── Types re-exported for convenience ────────────────────────────────────────
export { CorrelationName } from '../types/correlation-name.type';
export { KnownFluid } from '../types/known-fluid.type';
export { FlowRegime } from '../types/flow-regime.type';
