import type { SpecificHeatResult } from './specific-heat-result.type';
import type { ThermalConductivityResult } from './thermal-conductivity-result.type';
import type { ThermalExpansionResult } from './thermal-expansion-result.type';
import type { ThermalPerformanceMetadata } from './thermal-performance-metadata.type';

/** Complete thermal performance result (all properties). */
export type ThermalPerformanceResult = {
  /** Thermal conductivity result */
  conductivity?: ThermalConductivityResult;

  /** Specific heat result */
  specificHeat?: SpecificHeatResult;

  /** Thermal expansion result */
  expansion?: ThermalExpansionResult;

  /** Temperature used (°C) */
  temperature: number;

  /** Composition used */
  composition: Record<string, number>;

  /** Calculation metadata */
  metadata: ThermalPerformanceMetadata;

  /** Warnings or notes */
  warnings: string[];
};
