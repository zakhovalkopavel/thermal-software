import { Injectable } from '@nestjs/common';
import { WorkabilityType } from '../enums/workability.enum';
import {
  WORKABILITY_FACTORS,
  WATER_DEMAND_CONSTANTS,
} from '../constants/water-demand-constants';

// Re-export enums for convenience
export { WorkabilityType };

/**
 * Water Demand Service
 * Calculates water requirement for refractory castables based on packing density
 *
 * Water demand is the amount of water (as % by mass) needed to achieve desired
 * workability. It is NOT equal to porosity but rather a fraction (30-50%) of
 * available void space.
 *
 * References:
 * - de Larrard, F. (1999): Water fills 40-45% of void volume
 * - Banerjee, S. (2004): Refractory castables need 35-50% water fill
 * - Pileggi et al. (2001): Rheology depends on water-void ratio
 *
 * Formula: waterDemand = workabilityFactor × (1 - φ_packing) × 100
 *
 * Workability Factors:
 * - FIRM (0.38): minimum water, vibration-intensive
 * - STANDARD (0.42): balanced flow and strength (DEFAULT)
 * - FLOWABLE (0.50): maximum water, self-flowing
 */
@Injectable()
export class WaterDemandService {
  /**
   * Calculate water demand based on packing fraction and workability
   *
   * Water demand is typically 30-50% of void space (NOT equal to porosity)
   *
   * Formula: waterDemand = workabilityFactor × (1 - φ_packing) × 100
   *
   * @param packingFraction φ (0-1) - packing efficiency
   * @param workability - WorkabilityType.FIRM (0.38), STANDARD (0.42), FLOWABLE (0.50)
   * @returns Water demand as % by mass of dry material
   *
   * @example
   * // High-alumina castable
   * const waterDemand = service.calculateWaterDemand(0.74, WorkabilityType.STANDARD);
   * // Returns: 10.9 (typical 10-12%)
   *
   * @example
   * // Self-flowing castable
   * const waterDemand = service.calculateWaterDemand(0.73, WorkabilityType.FLOWABLE);
   * // Returns: 13.5 (typical 12-14%)
   */
  calculateWaterDemand(
    packingFraction: number,
    workability: WorkabilityType = WATER_DEMAND_CONSTANTS.DEFAULT_WORKABILITY
  ): number {
    // Validate input
    if (
      packingFraction < WATER_DEMAND_CONSTANTS.MIN_PACKING_FRACTION ||
      packingFraction > WATER_DEMAND_CONSTANTS.MAX_PACKING_FRACTION
    ) {
      throw new Error('Packing fraction must be between 0 and 1');
    }

    const factor = WORKABILITY_FACTORS[workability];
    const porosity = 1 - packingFraction;
    const waterDemand = factor * porosity * 100;

    return Number(waterDemand.toFixed(WATER_DEMAND_CONSTANTS.DECIMAL_PLACES));
  }

  /**
   * Calculate water demand range based on packing fraction
   *
   * Provides min/typical/max options for design flexibility
   *
   * @param packingFraction φ (0-1)
   * @returns Object with min, typical, max water demand percentages
   *
   * @example
   * const range = service.calculateWaterDemandRange(0.75);
   * // Returns: { min: 9.5, typical: 10.5, max: 12.5 }
   */
  calculateWaterDemandRange(packingFraction: number): {
    min: number;
    typical: number;
    max: number;
  } {
    return {
      min: this.calculateWaterDemand(packingFraction, WorkabilityType.FIRM),
      typical: this.calculateWaterDemand(packingFraction, WATER_DEMAND_CONSTANTS.DEFAULT_WORKABILITY),
      max: this.calculateWaterDemand(packingFraction, WorkabilityType.FLOWABLE),
    };
  }

  /**
   * Get workability factor for given workability type
   *
   * @param workability - workability type
   * @returns Factor value (0.38-0.50)
   *
   * @example
   * const factor = service.getWorkabilityFactor(WorkabilityType.STANDARD);
   * // Returns: 0.42
   */
  getWorkabilityFactor(workability: WorkabilityType): number {
    return WORKABILITY_FACTORS[workability];
  }

  /**
   * Calculate porosity from packing fraction
   *
   * @param packingFraction φ (0-1)
   * @returns Porosity as percentage (0-100)
   *
   * @example
   * const porosity = service.calculatePorosity(0.75);
   * // Returns: 25.0
   */
  calculatePorosity(packingFraction: number): number {
    return Number(
      ((1 - packingFraction) * 100).toFixed(WATER_DEMAND_CONSTANTS.POROSITY_DECIMAL_PLACES)
    );
  }

  /**
   * Validate water demand value
   *
   * Checks if water demand is physically plausible:
   * - Never negative
   * - Never exceeds 50% (max would be 100% with flowable at 50% porosity)
   *
   * @param waterDemandPercent - water demand value
   * @returns true if valid, false otherwise
   *
   * @example
   * const isValid = service.validateWaterDemand(10.5);
   * // Returns: true
   */
  validateWaterDemand(waterDemandPercent: number): boolean {
    return (
      waterDemandPercent >= WATER_DEMAND_CONSTANTS.MIN_WATER_DEMAND &&
      waterDemandPercent <= WATER_DEMAND_CONSTANTS.MAX_WATER_DEMAND
    );
  }
}

