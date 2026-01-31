/**
 * Particle Size Distribution Calculator
 *
 * Implements optimal PSD models:
 * - Andreasen (Fuller-Andreasen packing law)
 * - Funk-Dinger modification
 *
 * References:
 * - Andreasen, A.A. (1930) "Über die Beziehung zwischen Kornabstufung und Zwischenraum"
 * - Fuller, W.B. & Thompson, S.E. (1907) "The Laws of Proportioning Concrete"
 * - Funk, J.E. & Dinger, D.R. (1994) "Predictive Process Control of Crowded Particulate Suspensions"
 *   https://www.springer.com/gp/book/9780792329680
 *
 * @module PSDCalculator
 */

import { FractionInput, PSDResult } from '../types/blend-types';

export class PSDCalculator {
  /**
   * Calculate Andreasen discrete PSD
   *
   * Formula: P(D) = (D^q - Dmin^q) / (Dmax^q - Dmin^q)
   *
   * @param fractions Array of particle size fractions
   * @param q Distribution modulus (typically 0.2-0.4)
   * @param Dmin_mm Minimum diameter (optional, auto-calculated if not provided)
   * @param Dmax_mm Maximum diameter (optional, auto-calculated if not provided)
   * @returns PSD result with mass fractions
   */
  public static andreasenDiscrete(
    fractions: FractionInput[],
    q: number,
    Dmin_mm?: number,
    Dmax_mm?: number
  ): PSDResult {
    // Validate inputs
    this.validateInputs(fractions, q);

    // Separate fixed and variable fractions
    const fixedFractions = fractions.filter(f => f.isFixed);
    const variableFractions = fractions.filter(f => !f.isFixed);

    // Validate fixed fractions
    const totalFixed = fixedFractions.reduce((sum, f) => sum + (f.fixedAmount || 0), 0);
    if (totalFixed >= 100) {
      throw new Error(`Fixed fractions sum to ${totalFixed}% which must be less than 100%`);
    }

    // Validate at least one variable fraction exists
    if (variableFractions.length === 0) {
      throw new Error('At least one variable (non-fixed) fraction must exist for optimization');
    }

    // Calculate remaining percentage for optimization
    const remainingPercent = 100 - totalFixed;

    // Auto-calculate Dmin and Dmax from VARIABLE fractions only
    const sortedVariableFractions = [...variableFractions].sort((a, b) => a.dMin_mm - b.dMin_mm);
    const calcDmin = Dmin_mm ?? sortedVariableFractions[0].dMin_mm;
    const calcDmax = Dmax_mm ?? sortedVariableFractions[sortedVariableFractions.length - 1].dMax_mm;

    // Validate Dmin < Dmax
    if (calcDmin >= calcDmax) {
      throw new Error(`Dmin (${calcDmin}) must be less than Dmax (${calcDmax})`);
    }

    // Calculate cumulative distribution function P(D)
    const calculateP = (D: number): number => {
      if (calcDmin === 0) {
        return Math.pow(D / calcDmax, q);
      } else {
        return (Math.pow(D, q) - Math.pow(calcDmin, q)) /
               (Math.pow(calcDmax, q) - Math.pow(calcDmin, q));
      }
    };

    // Calculate mass fractions for VARIABLE fractions only
    const variableMassFractions: number[] = [];
    for (const fraction of sortedVariableFractions) {
      const P_upper = calculateP(fraction.dMax_mm);
      const P_lower = calculateP(fraction.dMin_mm);
      const massFrac = P_upper - P_lower;
      variableMassFractions.push(massFrac);
    }

    // Normalize variable fractions to sum = 1
    const sum = variableMassFractions.reduce((acc, val) => acc + val, 0);
    const normalizedVariableFractions = variableMassFractions.map(mf => mf / sum);

    // Scale variable fractions to fit remaining percentage
    const scaledVariableFractions = normalizedVariableFractions.map(mf => mf * (remainingPercent / 100));

    // Combine fixed and variable fractions in original order
    const combinedMassFractions: number[] = [];
    const fixedFractionsUsed: { fractionId: string; fixedAmount: number }[] = [];

    for (const fraction of fractions) {
      if (fraction.isFixed && fraction.fixedAmount !== undefined) {
        combinedMassFractions.push(fraction.fixedAmount / 100);
        fixedFractionsUsed.push({
          fractionId: fraction.id,
          fixedAmount: fraction.fixedAmount
        });
      } else {
        const varIndex = sortedVariableFractions.findIndex(vf => vf.id === fraction.id);
        combinedMassFractions.push(scaledVariableFractions[varIndex]);
      }
    }

    // Round to integer percentages
    const massFractionsRoundedPercent = this.roundToIntegerPercent(combinedMassFractions);

    return {
      method: 'Andreasen',
      q,
      massFractions: combinedMassFractions,
      massFractionsRoundedPercent,
      Dmin_mm: calcDmin,
      Dmax_mm: calcDmax,
      fixedFractionsUsed: fixedFractionsUsed.length > 0 ? fixedFractionsUsed : undefined,
      variableFractionsCount: variableFractions.length,
      totalFixedPercent: totalFixed > 0 ? totalFixed : undefined
    };
  }

  /**
   * Calculate Funk-Dinger discrete PSD
   *
   * Modification of Andreasen formula with improved fine particle distribution
   *
   * @param fractions Array of particle size fractions
   * @param q Distribution modulus (typically 0.2-0.4)
   * @param Dmin_mm Minimum diameter (recommended: 0.001 mm or smallest measurable)
   * @param Dmax_mm Maximum diameter (optional, auto-calculated if not provided)
   * @returns PSD result with mass fractions
   */
  public static funkDingerDiscrete(
    fractions: FractionInput[],
    q: number,
    Dmin_mm?: number,
    Dmax_mm?: number
  ): PSDResult {
    // Validate inputs
    this.validateInputs(fractions, q);

    // Separate fixed and variable fractions
    const fixedFractions = fractions.filter(f => f.isFixed);
    const variableFractions = fractions.filter(f => !f.isFixed);

    // Validate fixed fractions
    const totalFixed = fixedFractions.reduce((sum, f) => sum + (f.fixedAmount || 0), 0);
    if (totalFixed >= 100) {
      throw new Error(`Fixed fractions sum to ${totalFixed}% which must be less than 100%`);
    }

    if (variableFractions.length === 0) {
      throw new Error('At least one variable (non-fixed) fraction must exist for optimization');
    }

    // Calculate remaining percentage for optimization
    const remainingPercent = 100 - totalFixed;

    // Auto-calculate Dmin and Dmax from VARIABLE fractions only
    const sortedVariableFractions = [...variableFractions].sort((a, b) => a.dMin_mm - b.dMin_mm);

    // Funk-Dinger recommends Dmin = 0.001 mm or smallest measurable particle
    const calcDmin = Dmin_mm ?? Math.max(0.001, sortedVariableFractions[0].dMin_mm * 0.01);
    const calcDmax = Dmax_mm ?? sortedVariableFractions[sortedVariableFractions.length - 1].dMax_mm;

    // Validate Dmin < Dmax
    if (calcDmin >= calcDmax) {
      throw new Error(`Dmin (${calcDmin}) must be less than Dmax (${calcDmax})`);
    }

    // Funk-Dinger uses the same formula as modified Andreasen with Dmin > 0
    const calculateP = (D: number): number => {
      return (Math.pow(D, q) - Math.pow(calcDmin, q)) /
             (Math.pow(calcDmax, q) - Math.pow(calcDmin, q));
    };

    // Calculate mass fractions for VARIABLE fractions only
    const variableMassFractions: number[] = [];
    for (const fraction of sortedVariableFractions) {
      const P_upper = calculateP(fraction.dMax_mm);
      const P_lower = calculateP(fraction.dMin_mm);
      const massFrac = P_upper - P_lower;
      variableMassFractions.push(massFrac);
    }

    // Normalize variable fractions to sum = 1
    const sum = variableMassFractions.reduce((acc, val) => acc + val, 0);
    const normalizedVariableFractions = variableMassFractions.map(mf => mf / sum);

    // Scale variable fractions to fit remaining percentage
    const scaledVariableFractions = normalizedVariableFractions.map(mf => mf * (remainingPercent / 100));

    // Combine fixed and variable fractions in original order
    const combinedMassFractions: number[] = [];
    const fixedFractionsUsed: { fractionId: string; fixedAmount: number }[] = [];

    for (const fraction of fractions) {
      if (fraction.isFixed && fraction.fixedAmount !== undefined) {
        combinedMassFractions.push(fraction.fixedAmount / 100);
        fixedFractionsUsed.push({
          fractionId: fraction.id,
          fixedAmount: fraction.fixedAmount
        });
      } else {
        const varIndex = sortedVariableFractions.findIndex(vf => vf.id === fraction.id);
        combinedMassFractions.push(scaledVariableFractions[varIndex]);
      }
    }

    // Round to integer percentages
    const massFractionsRoundedPercent = this.roundToIntegerPercent(combinedMassFractions);

    return {
      method: 'FunkDinger',
      q,
      massFractions: combinedMassFractions,
      massFractionsRoundedPercent,
      Dmin_mm: calcDmin,
      Dmax_mm: calcDmax,
      fixedFractionsUsed: fixedFractionsUsed.length > 0 ? fixedFractionsUsed : undefined,
      variableFractionsCount: variableFractions.length,
      totalFixedPercent: totalFixed > 0 ? totalFixed : undefined
    };
  }

  /**
   * Calculate characteristic diameter D50 from PSD
   */
  public static calculateD50(fractions: FractionInput[], massFractions: number[]): number {
    if (fractions.length !== massFractions.length) {
      throw new Error('Fractions and mass fractions arrays must have same length');
    }

    // Sort by size
    const combined = fractions.map((f, i) => ({
      fraction: f,
      mass: massFractions[i],
      dMean: (f.dMin_mm + f.dMax_mm) / 2
    })).sort((a, b) => a.dMean - b.dMean);

    // Find cumulative 50% point
    let cumulative = 0;
    for (const item of combined) {
      cumulative += item.mass;
      if (cumulative >= 0.5) {
        return item.dMean;
      }
    }

    return combined[combined.length - 1].dMean;
  }

  /**
   * Calculate specific surface area (Blaine) from PSD
   * Approximate calculation assuming spherical particles
   *
   * @returns Specific surface area in m²/kg
   */
  public static calculateSpecificSurface(
    fractions: FractionInput[],
    massFractions: number[],
    densities_kgm3: number[]
  ): number {
    if (fractions.length !== massFractions.length || fractions.length !== densities_kgm3.length) {
      throw new Error('Input arrays must have same length');
    }

    let totalSurface = 0;

    for (let i = 0; i < fractions.length; i++) {
      const dMean_m = ((fractions[i].dMin_mm + fractions[i].dMax_mm) / 2) * 0.001;
      const density = densities_kgm3[i];
      const mass = massFractions[i];

      // For spherical particles: Specific surface = 6 / (ρ × d)
      const specificSurface_i = 6 / (density * dMean_m);
      totalSurface += mass * specificSurface_i;
    }

    return totalSurface;
  }

  /**
   * Validate inputs
   */
  private static validateInputs(fractions: FractionInput[], q: number): void {
    if (!fractions || fractions.length === 0) {
      throw new Error('Fractions array cannot be empty');
    }

    if (q <= 0 || q > 1) {
      throw new Error('q must be in range (0, 1]');
    }

    // Validate each fraction
    for (const fraction of fractions) {
      if (fraction.dMin_mm < 0) {
        throw new Error(`Fraction ${fraction.id}: dMin cannot be negative`);
      }
      if (fraction.dMax_mm <= fraction.dMin_mm) {
        throw new Error(`Fraction ${fraction.id}: dMax must be greater than dMin`);
      }
    }

    // Check for overlapping bins (warning, not error)
    const sortedFractions = [...fractions].sort((a, b) => a.dMin_mm - b.dMin_mm);
    for (let i = 0; i < sortedFractions.length - 1; i++) {
      if (sortedFractions[i].dMax_mm > sortedFractions[i + 1].dMin_mm) {
        console.warn(`Warning: Fractions ${sortedFractions[i].id} and ${sortedFractions[i + 1].id} overlap`);
      }
    }
  }

  /**
   * Round mass fractions to integer percentages summing to 100
   * Uses largest remainder method to ensure sum = 100
   */
  private static roundToIntegerPercent(massFractions: number[]): number[] {
    // Convert to percentages
    const percentages = massFractions.map(mf => mf * 100);

    // Get integer parts
    const integers = percentages.map(p => Math.floor(p));

    // Calculate remainders
    const remainders = percentages.map((p, i) => ({
      index: i,
      remainder: p - integers[i]
    }));

    // Sort by remainder descending
    remainders.sort((a, b) => b.remainder - a.remainder);

    // Calculate how many units needed to reach 100
    let sum = integers.reduce((acc, val) => acc + val, 0);
    let unitsToAdd = 100 - sum;

    // Add 1 to fractions with largest remainders
    for (let i = 0; i < unitsToAdd && i < remainders.length; i++) {
      integers[remainders[i].index]++;
    }

    // Verify sum = 100
    sum = integers.reduce((acc, val) => acc + val, 0);
    if (sum !== 100) {
      // Edge case: adjust last non-zero element
      const lastNonZero = integers.findIndex(v => v > 0);
      if (lastNonZero >= 0) {
        integers[lastNonZero] += (100 - sum);
      }
    }

    return integers;
  }

  /**
   * Generate PSD curve data points for plotting
   */
  public static generateCurveData(
    Dmin_mm: number,
    Dmax_mm: number,
    q: number,
    numPoints: number = 100
  ): { D: number; P: number }[] {
    const points: { D: number; P: number }[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const D = Dmin_mm + (Dmax_mm - Dmin_mm) * (i / numPoints);
      let P: number;

      if (Dmin_mm === 0) {
        P = Math.pow(D / Dmax_mm, q);
      } else {
        P = (Math.pow(D, q) - Math.pow(Dmin_mm, q)) /
            (Math.pow(Dmax_mm, q) - Math.pow(Dmin_mm, q));
      }

      points.push({ D, P: P * 100 });  // Convert to percentage
    }

    return points;
  }

  /**
   * Compare multiple PSD results
   */
  public static comparePSDs(results: PSDResult[]): {
    method: string;
    q: number;
    D50: number;
    uniformityCoefficient: number;
  }[] {
    return results.map(result => ({
      method: result.method,
      q: result.q,
      D50: (result.Dmin_mm + result.Dmax_mm) / 2,  // Simplified
      uniformityCoefficient: result.Dmax_mm / result.Dmin_mm
    }));
  }

  /**
   * Recommend q value based on application
   */
  public static recommendQ(application: string): { q: number; description: string } {
    const recommendations: { [key: string]: { q: number; description: string } } = {
      'self-compacting': {
        q: 0.25,
        description: 'Maximum packing, flowing consistency, no vibration needed'
      },
      'flowable': {
        q: 0.27,
        description: 'High packing, pumpable, minimal vibration'
      },
      'vibrated': {
        q: 0.30,
        description: 'Good packing with vibration, standard castables'
      },
      'hand-pressed': {
        q: 0.33,
        description: 'Plastic consistency, ramming mixes'
      },
      'gunning': {
        q: 0.37,
        description: 'Coarser distribution for gunning/shotcreting'
      }
    };

    const rec = recommendations[application.toLowerCase()];
    if (!rec) {
      return {
        q: 0.30,
        description: 'Default recommendation for general purpose'
      };
    }

    return rec;
  }
}

