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

// Export services
export { RefractoryCalculatorService } from './services/RefractoryCalculatorService';

// Export data
export { ComponentDictionary } from './data/ComponentDictionary';

// Re-export main service as default
export { RefractoryCalculatorService as default } from './services/RefractoryCalculatorService';

