/**
 * Refractory Calculator Service
 * Main facade that orchestrates all calculations
 * Uses Facade pattern to provide simplified interface
 */

import { BaseCalculator } from '../core/BaseCalculator';
import { ConfigurationManager } from '../core/ConfigurationManager';
import { InputValidator } from '../validators/InputValidator';
import { Component } from '../models/Component';
import { ParticipationCalculator } from '../calculators/ParticipationCalculator';
import { PhaseEquilibriumCalculator } from '../calculators/PhaseEquilibriumCalculator';
import { ViscosityCalculator } from '../calculators/ViscosityCalculator';
import { ThermalPerformanceCalculator } from '../calculators/ThermalPerformanceCalculator';
import { RefractorinessStandardsCalculator } from '../calculators/RefractorinessStandardsCalculator';
import {
  IComponent,
  CalculationResult,
  RefractoryConfig,
  OxideComposition
} from '../types';

export class RefractoryCalculatorService extends BaseCalculator {
  private configManager: ConfigurationManager;
  private validator: InputValidator;
  private participationCalc: ParticipationCalculator;
  private phaseCalc: PhaseEquilibriumCalculator;
  private viscosityCalc: ViscosityCalculator;
  private thermalCalc: ThermalPerformanceCalculator;
  private refractorinessCalc: RefractorinessStandardsCalculator;
  private config: RefractoryConfig;

  constructor(userConfig?: Partial<RefractoryConfig>) {
    super();

    // Initialize configuration
    this.configManager = ConfigurationManager.getInstance();
    this.config = userConfig
      ? this.configManager.mergeConfig(userConfig)
      : this.configManager.getConfig();

    // Initialize validators and calculators
    this.validator = new InputValidator(this.config);
    this.participationCalc = new ParticipationCalculator(this.config);
    this.phaseCalc = new PhaseEquilibriumCalculator(this.config);
    this.viscosityCalc = new ViscosityCalculator(this.config);
    this.thermalCalc = new ThermalPerformanceCalculator(this.config);
    this.refractorinessCalc = new RefractorinessStandardsCalculator();
  }

  /**
   * Main calculation method
   */
  public calculate(
    components: IComponent[],
    temperature: number
  ): CalculationResult {
    // Reset diagnostics
    this.resetDiagnostics();

    // Add standard assumptions
    this.addAssumption('Oxidizing atmosphere (Fe³⁺)');
    this.addAssumption(
      `CAS liquid formed with ${this.config.liquidFormation.anorthiteRatio * 100}:` +
      `${this.config.liquidFormation.gehleniteRatio * 100} anorthite:gehlenite ratio`
    );

    // Validate inputs
    temperature = this.validator.validateTemperature(temperature);
    const validatedComponents = this.validator.validateComponents(components);

    // Add validation warnings
    const validationWarnings = this.validator.getWarnings();
    validationWarnings.forEach(w => this.addWarning(w));

    // Convert to Component objects
    const componentObjects = validatedComponents.map(c => Component.fromObject(c));

    // Build fraction inventory
    const fractionInventory = this.buildFractionInventory(componentObjects);

    // Calculate available oxides considering participation
    const availableOxides = this.participationCalc.calculateAvailableOxides(
      temperature,
      fractionInventory
    );

    // Calculate liquid-solid split
    const { liquid, solid } = this.phaseCalc.calculateLiquidSolidSplit(
      availableOxides,
      temperature
    );

    // Add phase calculator diagnostics
    const phaseDiagnostics = this.phaseCalc.getDiagnostics();
    phaseDiagnostics.assumptions.forEach(a => this.addAssumption(a));

    // Calculate viscosity if liquid present
    if (liquid.percent > 0) {
      liquid.viscosity = this.viscosityCalc.calculateViscosity(
        liquid.composition,
        temperature
      );
    }

    // Calculate thermal performance
    const thermalPerformance = this.thermalCalc.calculate(liquid, solid, temperature);

    // Add thermal calculator warnings
    const thermalDiagnostics = this.thermalCalc.getDiagnostics();
    thermalDiagnostics.warnings.forEach(w => this.addWarning(w));

    // Calculate multi-model refractoriness standards evaluation
    // Use full phase equilibrium recalculation for accurate predictions
    const liquidFractionFunc = (T: number) => {
      // Full phase equilibrium calculation at each temperature
      const phaseResult = this.phaseCalc.calculateLiquidSolidSplit(
        availableOxides,
        T,
        100
      );
      return phaseResult.liquid.percent / 100; // Return as fraction 0-1
    };

    const refractorinessEvaluation = this.calculateRefractorinessStandards(
      availableOxides,
      liquidFractionFunc,
      temperature
    );

    // Check mass balance
    this.checkMassBalance(liquid.percent, solid.percent);

    return {
      solid,
      liquid,
      thermalPerformance,
      refractorinessEvaluation,
      diagnostics: this.getDiagnostics()
    };
  }

  /**
   * Calculate refractoriness standards (EN ISO 1893, ASTM PCE, GOST)
   */
  private calculateRefractorinessStandards(
    composition: OxideComposition,
    liquidFractionFunc: (temp: number) => number,
    currentTemperature: number
  ) {
    const multiModelResult = this.refractorinessCalc.calculateMultiModel(
      composition,
      liquidFractionFunc
    );

    // Extract specific standards
    const T05 = multiModelResult.points.find(p => p.criterion === 'T₀.₅')?.temperature || currentTemperature;
    const T1 = multiModelResult.points.find(p => p.criterion === 'T₁')?.temperature || currentTemperature;
    const T2 = multiModelResult.points.find(p => p.criterion === 'T₂')?.temperature || currentTemperature;
    const astmPCE = multiModelResult.points.find(p => p.criterion === 'PCE')?.temperature || currentTemperature;
    const gostCone = multiModelResult.points.find(p => p.criterion === 'GOST Cone')?.temperature || currentTemperature;

    return {
      points: multiModelResult.points,
      enISO1893: { T05, T1, T2 },
      astmPCE,
      gostCone,
      modelsSummary: multiModelResult.modelsSummary
    };
  }

  /**
   * Build fraction inventory from components
   */
  private buildFractionInventory(components: Component[]): Array<{
    size: number;
    amount: number;
    composition: OxideComposition;
    component: string;
  }> {
    const inventory: Array<{
      size: number;
      amount: number;
      composition: OxideComposition;
      component: string;
    }> = [];

    let totalComponentAmount = 0;
    for (const component of components) {
      totalComponentAmount += component.amount || 0;
    }

    // If no amounts specified, assume equal distribution
    if (totalComponentAmount === 0) {
      const equalAmount = 100 / components.length;
      components.forEach(c => c.amount = equalAmount);
      totalComponentAmount = 100;
    }

    for (const component of components) {
      const componentWeight = (component.amount || 0) / 100;

      for (const fraction of component.fractions) {
        const avgSize = (fraction.lowerSize + fraction.upperSize) / 2;
        const fractionWeight = (fraction.amount / 100) * componentWeight * 100;

        inventory.push({
          size: avgSize,
          amount: fractionWeight,
          composition: component.getNormalizedComposition(),
          component: component.name
        });
      }
    }

    return inventory;
  }

  /**
   * Check mass balance
   */
  private checkMassBalance(liquidPercent: number, solidPercent: number): void {
    const total = liquidPercent + solidPercent;
    const error = Math.abs(total - 100.0);

    this.diagnostics.massBalanceError = error;

    if (error > this.config.tolerances.massBalanceErrorMax) {
      this.addWarning(
        `Mass balance error: ${error.toFixed(3)}% ` +
        `(liquid ${liquidPercent.toFixed(2)}% + solid ${solidPercent.toFixed(2)}%)`
      );
    }
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): RefractoryConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfiguration(newConfig: Partial<RefractoryConfig>): void {
    this.config = this.configManager.mergeConfig(newConfig);

    // Reinitialize calculators with new config
    this.validator = new InputValidator(this.config);
    this.participationCalc = new ParticipationCalculator(this.config);
    this.phaseCalc = new PhaseEquilibriumCalculator(this.config);
    this.viscosityCalc = new ViscosityCalculator(this.config);
    this.thermalCalc = new ThermalPerformanceCalculator(this.config);
  }

  protected validateInput(): void {
    // Validation is done in calculate method
  }

  protected resetDiagnostics(): void {
    super.resetDiagnostics();
    this.diagnostics.assumptions = [
      'Oxidizing atmosphere (Fe³⁺)',
      `CAS liquid formed with ${this.config.liquidFormation.anorthiteRatio * 100}:` +
      `${this.config.liquidFormation.gehleniteRatio * 100} anorthite:gehlenite ratio`
    ];
  }
}

