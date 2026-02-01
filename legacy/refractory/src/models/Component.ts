/**
 * Component Model
 * Encapsulates component data and behavior
 */

import { IComponent, OxideComposition, ParticleSizeFraction } from '../types';

export class Component implements IComponent {
  public name: string;
  public description?: string;
  public composition: OxideComposition;
  public fractions: ParticleSizeFraction[];
  public amount?: number;

  constructor(data: IComponent) {
    this.name = data.name;
    this.description = data.description;
    this.composition = { ...data.composition };
    this.fractions = [...data.fractions];
    this.amount = data.amount;
  }

  /**
   * Get normalized composition (ensuring it sums to 100%)
   */
  public getNormalizedComposition(): OxideComposition {
    const sum: number = Object.values(this.composition).reduce((acc: number, val) => acc + (val || 0), 0);

    if (Math.abs(sum - 100) < 0.01) {
      return { ...this.composition };
    }

    const normalized: OxideComposition = {};
    if (sum > 0) {
      for (const [oxide, value] of Object.entries(this.composition)) {
        if (value !== undefined) {
          normalized[oxide] = (value / sum) * 100;
        }
      }
    }
    return normalized;
  }

  /**
   * Get total mass of a specific oxide
   */
  public getOxideMass(oxide: string, totalMass: number = 100): number {
    const percentage = this.composition[oxide] || 0;
    return (percentage / 100) * totalMass;
  }

  /**
   * Get average particle size
   */
  public getAverageParticleSize(): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const fraction of this.fractions) {
      const avgSize = (fraction.lowerSize + fraction.upperSize) / 2;
      weightedSum += avgSize * fraction.amount;
      totalWeight += fraction.amount;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Get fraction by size range
   */
  public getFractionInRange(minSize: number, maxSize: number): number {
    let total = 0;

    for (const fraction of this.fractions) {
      // Check if fraction overlaps with the range
      if (fraction.upperSize >= minSize && fraction.lowerSize <= maxSize) {
        total += fraction.amount;
      }
    }

    return total;
  }

  /**
   * Clone component
   */
  public clone(): Component {
    return new Component({
      name: this.name,
      description: this.description,
      composition: { ...this.composition },
      fractions: this.fractions.map(f => ({ ...f })),
      amount: this.amount
    });
  }

  /**
   * Create component from plain object
   */
  public static fromObject(data: IComponent): Component {
    return new Component(data);
  }

  /**
   * Convert to plain object
   */
  public toObject(): IComponent {
    return {
      name: this.name,
      description: this.description,
      composition: { ...this.composition },
      fractions: [...this.fractions],
      amount: this.amount
    };
  }
}

