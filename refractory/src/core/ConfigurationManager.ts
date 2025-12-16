/**
 * Configuration Manager
 * Singleton pattern for managing application configuration
 */

import { RefractoryConfig } from '../types';

export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: RefractoryConfig;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): RefractoryConfig {
    return {
      sizeClassThresholds: {
        fineMax: 0.1,
        mediumMax: 0.6,
        coarseMin: 3.0
      },
      participation: {
        T50_fine: 1325,
        T50_medium: 1425,
        T50_coarse: 1525,
        k_steepness: 0.01,
        coarseDampingSize: 3.0,
        coarseDampingRate: 0.1
      },
      liquidFormation: {
        anorthiteRatio: 0.60,
        gehleniteRatio: 0.40
      },
      viscosity: {
        A_base: 0.001,
        B_base: 12000,
        Al2O3_effect: 2000,
        SiO2_effect: 3000,
        CaO_effect: -1500,
        Fe2O3_effect: -1000,
        minViscosity: 0.01,
        maxViscosity: 1000
      },
      refractoriness: {
        T_base_softening: 1600,
        T_base_RUL: 1450,
        Al2O3Sensitivity: 400,
        liquidSensitivity: 15,
        fluxSensitivity: 100,
        liquidThresholdForRUL: 15,
        minRefractoriness: 1200,
        maxRefractoriness: 2000
      },
      tolerances: {
        massBalanceErrorMax: 0.5,
        compositionSumTolerance: 0.5
      },
      rounding: {
        percentDecimals: 2,
        compositionDecimals: 2,
        temperatureDecimals: 0,
        viscositySignificantFigures: 3
      },
      minTemperature: 1200,
      maxTemperature: 1800
    };
  }

  /**
   * Get current configuration
   */
  public getConfig(): RefractoryConfig {
    return { ...this.config };
  }

  /**
   * Update configuration with custom values
   */
  public updateConfig(customConfig: Partial<RefractoryConfig>): void {
    this.config = {
      ...this.config,
      ...customConfig
    };
  }

  /**
   * Reset to default configuration
   */
  public resetConfig(): void {
    this.config = this.getDefaultConfig();
  }

  /**
   * Merge user config with defaults
   */
  public mergeConfig(userConfig: Partial<RefractoryConfig>): RefractoryConfig {
    return {
      ...this.config,
      ...userConfig
    };
  }
}

