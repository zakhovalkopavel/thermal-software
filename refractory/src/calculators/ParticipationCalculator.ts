/**
 * Participation Calculator
 * Calculates how much of each particle size participates in reactions
 */

import { BaseCalculator } from '../core/BaseCalculator';
import { OxideComposition, RefractoryConfig } from '../types';

interface FractionInventory {
  size: number;
  amount: number;
  composition: OxideComposition;
  component: string;
}

export class ParticipationCalculator extends BaseCalculator {
  constructor(private config: RefractoryConfig) {
    super();
  }

  protected validateInput(temperature: number): void {
    if (temperature < this.config.minTemperature || temperature > this.config.maxTemperature) {
      throw new Error(`Temperature ${temperature}°C out of valid range`);
    }
  }

  /**
   * Calculate participation factor based on particle size and temperature
   */
  public calculateParticipationFactor(particleSize: number, temperature: number): number {
    this.validateInput(temperature);

    // Determine T50 based on size class
    let T50: number;
    if (particleSize <= this.config.sizeClassThresholds.fineMax) {
      T50 = this.config.participation.T50_fine;
    } else if (particleSize <= this.config.sizeClassThresholds.mediumMax) {
      T50 = this.config.participation.T50_medium;
    } else {
      T50 = this.config.participation.T50_coarse;
    }

    // Logistic function for participation
    const k = this.config.participation.k_steepness;
    let participation = 1.0 / (1.0 + Math.exp(-k * (temperature - T50)));

    // Apply coarse particle damping
    if (particleSize > this.config.participation.coarseDampingSize) {
      const dampingFactor = 1.0 -
        this.config.participation.coarseDampingRate *
        (particleSize - this.config.participation.coarseDampingSize);
      participation *= Math.max(0.1, dampingFactor);
    }

    return Math.max(0, Math.min(1, participation));
  }

  /**
   * Calculate available oxides considering particle size participation
   */
  public calculateAvailableOxides(
    temperature: number,
    fractionInventory: FractionInventory[]
  ): OxideComposition {
    const availableOxides: OxideComposition = {};
    let totalMass = 0;

    for (const item of fractionInventory) {
      const avgSize = item.size;
      const participation = this.calculateParticipationFactor(avgSize, temperature);
      const contributingMass = item.amount * participation;

      totalMass += contributingMass;

      // Add oxides from this fraction
      for (const [oxide, percentage] of Object.entries(item.composition)) {
        if (percentage !== undefined) {
          const oxideMass = (percentage / 100) * contributingMass;
          availableOxides[oxide] = (availableOxides[oxide] || 0) + oxideMass;
        }
      }
    }

    // Convert back to percentages
    if (totalMass > 0) {
      for (const oxide in availableOxides) {
        availableOxides[oxide] = (availableOxides[oxide]! / totalMass) * 100;
      }
    }

    return availableOxides;
  }

  protected calculate(): any {
    throw new Error('Use calculateParticipationFactor or calculateAvailableOxides');
  }
}

