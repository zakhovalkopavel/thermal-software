/**
 * Refractory Module - Interfaces Index
 *
 * Central export point for all TypeScript interfaces used in the refractory module.
 * Organizes interfaces by calculation domain for easy imports.
 *
 * Date: February 2, 2026
 */

// ============================================================
// BLEND OPTIMIZER INTERFACES
// ============================================================
export {
  Fraction,
  BlendOptimizationOptions,
  BlendOptimizationRequest,
  BlendOptimizationResult,
  BlendOptimizationResults,
  ShrinkagePrediction,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  isFraction,
  isBlendOptimizationOptions,
  isBlendOptimizationRequest,
} from './blend-optimizer.interface';

// ============================================================
// PSD CALCULATOR INTERFACES
// ============================================================
export {
  PSDFraction,
  PSDCalculationOptions,
  PSDCalculationRequest,
  PSDResult,
  PSDValidationResult,
  PSDValidationError,
  PSDValidationWarning,
  isPSDFraction,
  isPSDCalculationRequest,
  isPSDResult,
} from './psd-calculator.interface';

// ============================================================
// PACKING CALCULATOR INTERFACES
// ============================================================
export {
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
  isPackingInput,
  isCPMInput,
  isFurnasInput,
  isPackingResult,
} from './packing-calculator.interface';

// ============================================================
// SHRINKAGE CALCULATOR INTERFACES
// ============================================================
export {
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
  isShrinkageMaterial,
  isShrinkageInput,
  isShrinkageStage,
  isShrinkageResult,
} from './shrinkage-calculator.interface';

// ============================================================
// PHASE EQUILIBRIUM INTERFACES
// ============================================================
export {
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
  isPhaseEquilibriumInput,
  isPhaseData,
  isMineralPhase,
  isPhaseEquilibriumResult,
} from './phase-equilibrium.interface';

// ============================================================
// THERMAL PERFORMANCE INTERFACES
// ============================================================
export {
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
  isThermalInput,
  isThermalConductivityInput,
  isThermalConductivityResult,
  isSpecificHeatResult,
  isThermalExpansionResult,
  isThermalPerformanceResult,
} from './thermal-performance.interface';

// ============================================================
// REFRACTORINESS INTERFACES
// ============================================================
export {
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
  isRefractorinessInput,
  isRefractorinessResult,
  isISO1893Result,
  isASTMC24Result,
  isGOST4069Result,
} from './refractoriness.interface';

// ============================================================
// VISCOSITY INTERFACES
// ============================================================
export {
  ViscosityInput,
  ViscosityResult,
  ViscosityMetadata,
  ViscosityValidationResult,
  ViscosityValidationError,
  ViscosityValidationWarning,
  isViscosityInput,
  isViscosityResult,
} from './viscosity.interface';

// ============================================================
// GLASS VISCOSITY INTERFACES
// ============================================================
export {
  GlassViscosityInput,
  ASTMFixedPoint,
  GlassViscosityResult,
  GlassViscosityMetadata,
  GlassProcessingWindow,
  GlassViscosityValidationResult,
  GlassViscosityValidationError,
  GlassViscosityValidationWarning,
  isGlassViscosityInput,
  isGlassViscosityResult,
  isASTMFixedPoint,
} from './glass-viscosity.interface';

// ============================================================
// MINERAL PHASE INTERFACES
// ============================================================
export {
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
  isMineralPhaseInput,
  isMineralPhaseData,
  isMineralPhaseResult,
  isPhaseDistribution,
  isPhaseStability,
} from './mineral-phase.interface';

