/**
 * Refractory Module - Interfaces Index
 *
 * Central export point for all TypeScript interfaces used in the refractory module.
 * Organizes interfaces by calculation domain for easy imports.
 *
 * Date: February 2, 2026
 */

// ============================================================
// BLEND OPTIMIZER (types + guards; Phase 6.3)
// ============================================================
export type {
  Fraction,
  BlendOptimizationOptions,
  BlendOptimizationRequest,
  BlendOptimizationResult,
  BlendOptimizationResults,
  ViableCompositionRange,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../types';
export { BlendOptimizerTypeGuards } from '../utils/blend-optimizer-type-guards';

// ============================================================
// PSD CALCULATOR (types + guards; Phase 6.3)
// ============================================================
export type {
  PSDFraction,
  PSDCalculationOptions,
  PSDCalculationRequest,
  PSDResult,
  PSDValidationResult,
  PSDValidationError,
  PSDValidationWarning,
} from '../types';
export { PsdTypeGuards } from '../utils/psd-type-guards';

// ============================================================
// PACKING CALCULATOR (types + guards; Phase 6.3)
// ============================================================
export type {
  PackingInput,
  CPMCalibration,
  CPMInput,
  FurnasInput,
  PackingResult,
  PackingResultDetailed,
  PackingValidationResult,
  PackingValidationError,
  PackingValidationWarning,
  SortedFractions,
} from '../types';
export { PackingTypeGuards } from '../utils/packing-type-guards';

// ============================================================
// SHRINKAGE CALCULATOR (types + guards; Phase 6.3)
// ============================================================
export type {
  ShrinkageMaterial,
  CementType,
  ShrinkageInput,
  ShrinkageStage,
  DryingShrinkage,
  FiringShrinkage,
  ShrinkageResult,
  ShrinkageMetadata,
  ShrinkageValidationResult,
  ShrinkageValidationError,
  ShrinkageValidationWarning,
} from '../types';
export { ShrinkageTypeGuards } from '../utils/shrinkage-type-guards';

// ============================================================
// PHASE EQUILIBRIUM (types + guards; Phase 6.3)
// ============================================================
export type {
  PhaseEquilibriumInput,
  PhaseComponent,
  MineralPhase,
  PhaseData,
  SolidPhaseData,
  PhaseEquilibriumMetadata,
  PhaseEquilibriumResult,
  PhaseEquilibriumValidationResult,
  PhaseEquilibriumValidationError,
  PhaseEquilibriumValidationWarning,
  EutecticPoint,
  LiquidusResult,
} from '../types';
export { PhaseEquilibriumTypeGuards } from '../utils/phase-equilibrium-type-guards';

// ============================================================
// THERMAL PERFORMANCE (types + guards; Phase 6.3)
// ============================================================
export type {
  ThermalInput,
  ThermalConductivityInput,
  SpecificHeatInput,
  ThermalExpansionInput,
  ComponentThermalProperties,
  WeightedThermalProperty,
  ThermalConductivityResult,
  SpecificHeatResult,
  ThermalExpansionResult,
  ThermalPerformanceResult,
  ThermalPerformanceMetadata,
  ThermalValidationResult,
  ThermalValidationError,
  ThermalValidationWarning,
  TemperatureDependentProperty,
  PropertyCurve,
} from '../types';
export { ThermalPerformanceTypeGuards } from '../utils/thermal-performance-type-guards';

// ============================================================
// REFRACTORINESS (types + guards; Phase 6.3)
// ============================================================
export type {
  RefractorinessInput,
  RefractorinessStandard,
  ISO1893Result,
  ASTMC24Result,
  GOST4069Result,
  DutyClassification,
  RefractorinessResult,
  ComponentRefractorinesEffect,
  RefractorinessMetadata,
  RefractorinessValidationResult,
  RefractorinessValidationError,
  RefractorinessValidationWarning,
  RefractorinessComparison,
} from '../types';
export { RefractorinessTypeGuards } from '../utils/refractoriness-type-guards';

// ============================================================
// VISCOSITY INTERFACES
// ============================================================
// Viscosity interfaces removed: superseded by glass-viscosity interfaces and new spec.

// ============================================================
// GLASS VISCOSITY (types + guards; Phase 6.3)
// ============================================================
export type {
  GlassViscosityInput,
  ASTMFixedPoint,
  ModelParameters,
  ModelInfo,
  FixedPointSpans,
  FixedPoints,
  CompositionIssue,
  ValidationStatus,
  ComponentEffect,
  ComponentBreakdown,
  GlassViscosityMetadata,
  GlassViscosityResult,
  GlassProcessingWindow,
  GlassViscosityValidationResult,
  GlassViscosityValidationError,
  GlassViscosityValidationWarning,
} from '../types';
export { GlassViscosityTypeGuards } from '../utils/glass-viscosity-type-guards';

// ============================================================
// MINERAL PHASE (types + guards; Phase 6.3)
// ============================================================
export type {
  MineralPhaseData,
  MineralPhaseInput,
  MineralPhaseResult,
  MineralPhaseMetadata,
  PhaseDistribution,
  PhaseStability,
  MineralPhaseValidationResult,
  MineralPhaseValidationError,
  MineralPhaseValidationWarning,
  PhaseTemperatureComparison,
} from '../types';
export { MineralPhaseTypeGuards } from '../utils/mineral-phase-type-guards';

