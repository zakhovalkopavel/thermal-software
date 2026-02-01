/**
 * Refractory Calculator TypeScript Library
 * Main entry point
 *
 * @packageDocumentation
 */

// Export types
export * from './types';

// Export core classes
export { BaseCalculator } from './core/BaseCalculator';
export { ConfigurationManager } from './core/ConfigurationManager';

// Export validators
export {
  InputValidator,
  IValidator,
  TemperatureValidator,
  CompositionValidator,
  ComponentValidator
} from './validators/InputValidator';

// Export models
export { Component } from './models/Component';

// Export repositories
export {
  PhaseDiagramRepository,
  IPhaseDiagramRepository
} from './repositories/PhaseDiagramRepository';

// Export calculators
export { ParticipationCalculator } from './calculators/ParticipationCalculator';
export { PhaseEquilibriumCalculator } from './calculators/PhaseEquilibriumCalculator';
export { ViscosityCalculator } from './calculators/ViscosityCalculator';
export { ThermalPerformanceCalculator } from './calculators/ThermalPerformanceCalculator';
export { MineralPhaseIdentifier } from './calculators/MineralPhaseIdentifier';
export { GlassViscosityCalculator } from './calculators/GlassViscosityCalculator';
export { RefractorinessStandardsCalculator } from './calculators/RefractorinessStandardsCalculator';
export { PSDCalculator } from './calculators/PSDCalculator';
export { PackingCalculator } from './calculators/PackingCalculator';
export { ShrinkageCalculator } from './calculators/ShrinkageCalculator';
export { BlendOptimizer } from './calculators/BlendOptimizer';

// Export services
export { RefractoryCalculatorService } from './services/RefractoryCalculatorService';
export { MixLibraryService } from './services/MixLibraryService';

// Export data
export { ComponentDictionary } from './data/ComponentDictionary';
export { MaterialLibrary } from './data/MaterialLibrary';

// Re-export main service as default
export { RefractoryCalculatorService as default } from './services/RefractoryCalculatorService';

