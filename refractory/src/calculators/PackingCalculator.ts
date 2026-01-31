/**
 * Packing Calculator - CPM and Furnas Models
 *
 * Implements:
 * - Compressible Packing Model (CPM) by de Larrard
 * - Furnas sequential filling model
 *
 * References:
 * - de Larrard, F. (1999) "Concrete Mixture Proportioning: A Scientific Approach"
 *   https://www.springer.com/gp/book/9780419235408
 * - Furnas, C.C. (1931) "Grading Aggregates - Mathematical Relations for Beds of Broken Solids"
 * - Wong, H.H.C. & Kwan, A.K.H. (2008) "Packing density of cementitious materials"
 *
 * @module PackingCalculator
 */

import { PackingResult } from '../types/blend-types';

export interface PackingInputs {
  massFractions: number[];  // Mass fractions (sum = 1)
  densities_kgm3: number[];  // True density of each fraction
  diameters_mm: number[];  // Representative diameter of each fraction
  compactionPressure_MPa?: number;  // Compaction pressure (default: scenario-dependent)
  shapeFactor?: number[];  // Shape factor (1.0 = spherical)
}

export class PackingCalculator {
  // Default calibration constants
  private static readonly CPM_BETA0_SPHERICAL = 0.64;  // Random close packing for spheres
  private static readonly CPM_K = 9.0;  // Compaction constant (de Larrard)
  private static readonly FURNAS_EFFICIENCY = 0.75;  // Void filling efficiency

  /**
   * Calculate packing using Compressible Packing Model (CPM)
   *
   * Simplified implementation of de Larrard's CPM
   *
   * @param inputs Packing input parameters
   * @param calibration Optional calibration overrides
   * @returns Packing result with phi and porosity
   */
  public static calculateCPM(
    inputs: PackingInputs,
    calibration?: { beta0?: number; K?: number }
  ): PackingResult {
    // Validate inputs
    this.validateInputs(inputs);

    const { massFractions, densities_kgm3, diameters_mm, compactionPressure_MPa, shapeFactor } = inputs;
    const n = massFractions.length;

    // Use calibration values or defaults
    const beta0 = calibration?.beta0 ?? this.CPM_BETA0_SPHERICAL;
    const K = calibration?.K ?? this.CPM_K;

    // Convert mass fractions to volume fractions
    const volumeFractions = this.massToVolumeFractions(massFractions, densities_kgm3);

    // Sort by diameter descending
    const sorted = this.sortBySize(volumeFractions, diameters_mm, densities_kgm3, shapeFactor);

    // Calculate compaction index (0 = no compaction, 1 = maximum)
    const compactionIndex = this.calculateCompactionIndex(compactionPressure_MPa ?? 0);

    // Calculate virtual packing for each class
    const virtualPacking: number[] = [];
    for (let i = 0; i < n; i++) {
      const shape = sorted.shapeFactor[i];
      // Adjust beta0 for non-spherical particles
      const beta0_i = beta0 / Math.pow(shape, 0.333);
      // Apply compaction effect
      const beta_i = beta0_i / (1 - K * compactionIndex);
      virtualPacking.push(Math.min(beta_i, 1.0));
    }

    // Calculate binary interaction matrix (dominance factors)
    const dominance = this.calculateDominanceMatrix(sorted.diameters_mm);

    // Solve for actual packing fraction using CPM equations
    const phi = this.solveCPM(sorted.volumeFractions, virtualPacking, dominance);

    // Calculate porosity
    const porosity = 1 - phi;

    return {
      model: 'CPM',
      packingFraction_phi: Math.round(phi * 1000) / 1000,  // 3 decimals
      porosity_initial: Math.round(porosity * 1000) / 1000,
      effectivePackingDensity: phi,
      calibrationParams: {
        virtualPacking_beta0: beta0,
        compactionIndex: compactionIndex,
        efficiencyFactor: undefined
      },
      notes: `CPM model with ${n} size classes, compaction index = ${compactionIndex.toFixed(3)}`
    };
  }

  /**
   * Calculate packing using Furnas sequential filling model
   *
   * @param inputs Packing input parameters
   * @param efficiencyFactor Void filling efficiency (0-1, default 0.75)
   * @returns Packing result with phi and porosity
   */
  public static calculateFurnas(
    inputs: PackingInputs,
    efficiencyFactor?: number
  ): PackingResult {
    // Validate inputs
    this.validateInputs(inputs);

    const { massFractions, densities_kgm3, diameters_mm } = inputs;
    const n = massFractions.length;
    const efficiency = efficiencyFactor ?? this.FURNAS_EFFICIENCY;

    // Convert mass to volume fractions
    const volumeFractions = this.massToVolumeFractions(massFractions, densities_kgm3);

    // Sort by diameter descending (largest first)
    const sorted = this.sortBySize(volumeFractions, diameters_mm, densities_kgm3);

    // Sequential filling
    let totalSolidsVolume = 0;
    let totalVolumeOccupied = 0;

    for (let i = 0; i < n; i++) {
      const volFrac_i = sorted.volumeFractions[i];

      if (i === 0) {
        // Largest fraction - initial random close packing
        const phi0 = this.CPM_BETA0_SPHERICAL;
        totalSolidsVolume = volFrac_i;
        totalVolumeOccupied = volFrac_i / phi0;
      } else {
        // Smaller fractions fill voids
        const currentVoidVolume = totalVolumeOccupied - totalSolidsVolume;
        const sizeRatio = sorted.diameters_mm[i] / sorted.diameters_mm[0];

        // Efficiency decreases with size ratio
        const adjustedEfficiency = efficiency * Math.pow(sizeRatio, 0.5);

        // Volume that can be filled
        const fillableVoid = currentVoidVolume * adjustedEfficiency;

        // Actual volume filled by this fraction
        const volumeNeeded = volFrac_i / this.CPM_BETA0_SPHERICAL;
        // const volumeFilled = Math.min(volumeNeeded, fillableVoid); // Unused but kept for reference

        totalSolidsVolume += volFrac_i;

        // If fraction doesn't fit in voids, add to total volume
        if (volumeNeeded > fillableVoid) {
          totalVolumeOccupied += (volumeNeeded - fillableVoid);
        }
      }
    }

    const phi = totalSolidsVolume / totalVolumeOccupied;
    const porosity = 1 - phi;

    return {
      model: 'Furnas',
      packingFraction_phi: Math.round(phi * 1000) / 1000,
      porosity_initial: Math.round(porosity * 1000) / 1000,
      effectivePackingDensity: phi,
      calibrationParams: {
        virtualPacking_beta0: undefined,
        compactionIndex: undefined,
        efficiencyFactor: efficiency
      },
      notes: `Furnas sequential filling with ${n} size classes, efficiency = ${efficiency.toFixed(2)}`
    };
  }

  /**
   * Convert mass fractions to volume fractions
   */
  private static massToVolumeFractions(
    massFractions: number[],
    densities_kgm3: number[]
  ): number[] {
    if (massFractions.length !== densities_kgm3.length) {
      throw new Error('Mass fractions and densities arrays must have same length');
    }

    // Calculate specific volumes (1/density)
    const specificVolumes = massFractions.map((m, i) => m / densities_kgm3[i]);

    // Normalize to sum = 1
    const totalVolume = specificVolumes.reduce((sum, v) => sum + v, 0);

    return specificVolumes.map(v => v / totalVolume);
  }

  /**
   * Sort arrays by particle diameter descending
   */
  private static sortBySize(
    volumeFractions: number[],
    diameters_mm: number[],
    densities_kgm3: number[],
    shapeFactor?: number[]
  ): {
    volumeFractions: number[];
    diameters_mm: number[];
    densities_kgm3: number[];
    shapeFactor: number[];
  } {
    const n = volumeFractions.length;
    const indices = Array.from({ length: n }, (_, i) => i);

    // Sort indices by diameter descending
    indices.sort((a, b) => diameters_mm[b] - diameters_mm[a]);

    return {
      volumeFractions: indices.map(i => volumeFractions[i]),
      diameters_mm: indices.map(i => diameters_mm[i]),
      densities_kgm3: indices.map(i => densities_kgm3[i]),
      shapeFactor: indices.map(i => shapeFactor?.[i] ?? 1.0)
    };
  }

  /**
   * Calculate compaction index from pressure
   * Maps pressure to compaction index (0-1)
   */
  private static calculateCompactionIndex(pressure_MPa: number): number {
    // Empirical mapping: 0 MPa -> 0, 10 MPa -> 0.5, 100 MPa -> 0.9
    // Using logarithmic relationship
    if (pressure_MPa <= 0) return 0;

    const index = Math.log10(1 + pressure_MPa) / Math.log10(101);
    return Math.min(index, 0.95);  // Cap at 0.95
  }

  /**
   * Calculate binary dominance matrix for CPM
   *
   * Dominance factor a_ij represents effect of class j on class i
   */
  private static calculateDominanceMatrix(diameters_mm: number[]): number[][] {
    const n = diameters_mm.length;
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          const ratio = diameters_mm[j] / diameters_mm[i];

          if (ratio > 1) {
            // Larger particle dominates - loosening effect
            matrix[i][j] = 1.0 - Math.pow(1.0 - ratio, 1.5);
          } else {
            // Smaller particle - wall effect
            matrix[i][j] = Math.pow(ratio, 1.5);
          }
        }
      }
    }

    return matrix;
  }

  /**
   * Solve CPM equations for packing fraction
   *
   * Iterative solution of: phi = sum(y_i * beta_i) / (1 + sum(a_ij * y_j / beta_i))
   */
  private static solveCPM(
    volumeFractions: number[],
    virtualPacking: number[],
    dominance: number[][]
  ): number {
    const n = volumeFractions.length;
    const maxIterations = 100;
    const tolerance = 1e-6;

    // Initial guess: weighted average of virtual packing
    let phi = volumeFractions.reduce((sum, y, i) => sum + y * virtualPacking[i], 0);

    // Iterative solution
    for (let iter = 0; iter < maxIterations; iter++) {
      let phi_new = 0;

      for (let i = 0; i < n; i++) {
        let denominator = 1.0;

        for (let j = 0; j < n; j++) {
          if (i !== j) {
            denominator += dominance[i][j] * volumeFractions[j] / virtualPacking[i];
          }
        }

        phi_new += volumeFractions[i] * virtualPacking[i] / denominator;
      }

      // Check convergence
      if (Math.abs(phi_new - phi) < tolerance) {
        return phi_new;
      }

      phi = phi_new;
    }

    console.warn('CPM solver did not converge, using last iteration result');
    return phi;
  }

  /**
   * Validate packing inputs
   */
  private static validateInputs(inputs: PackingInputs): void {
    const { massFractions, densities_kgm3, diameters_mm } = inputs;

    if (massFractions.length !== densities_kgm3.length ||
        massFractions.length !== diameters_mm.length) {
      throw new Error('All input arrays must have same length');
    }

    if (massFractions.length === 0) {
      throw new Error('Input arrays cannot be empty');
    }

    const sum = massFractions.reduce((acc, val) => acc + val, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      throw new Error(`Mass fractions must sum to 1.0 (got ${sum.toFixed(3)})`);
    }

    for (let i = 0; i < massFractions.length; i++) {
      if (massFractions[i] < 0 || massFractions[i] > 1) {
        throw new Error(`Mass fraction ${i} out of range [0, 1]`);
      }
      if (densities_kgm3[i] <= 0) {
        throw new Error(`Density ${i} must be positive`);
      }
      if (diameters_mm[i] <= 0) {
        throw new Error(`Diameter ${i} must be positive`);
      }
    }
  }

  /**
   * Calculate packing efficiency relative to theoretical maximum
   */
  public static calculatePackingEfficiency(phi: number): number {
    // Theoretical maximum for random packing: ~0.64
    // For face-centered cubic: 0.74
    const theoreticalMax = 0.74;
    return phi / theoreticalMax;
  }

  /**
   * Estimate flowability from packing fraction and PSD
   */
  public static estimateFlowability(
    phi: number,
    _d50_mm: number, // Reserved for future use
    finesContent: number  // Fraction < 0.1 mm
  ): 'Self-compacting' | 'Flowable' | 'Vibratable' | 'Hand-pressable' {
    // High phi and high fines -> self-compacting
    if (phi > 0.72 && finesContent > 0.15) {
      return 'Self-compacting';
    }

    // Good phi and moderate fines -> flowable
    if (phi > 0.68 && finesContent > 0.10) {
      return 'Flowable';
    }

    // Medium phi -> vibratable
    if (phi > 0.64) {
      return 'Vibratable';
    }

    // Low phi or coarse -> hand-pressable
    return 'Hand-pressable';
  }

  /**
   * Compare CPM and Furnas results
   */
  public static compareModels(inputs: PackingInputs): {
    cpm: PackingResult;
    furnas: PackingResult;
    difference_percent: number;
  } {
    const cpm = this.calculateCPM(inputs);
    const furnas = this.calculateFurnas(inputs);

    const difference_percent = Math.abs(cpm.packingFraction_phi - furnas.packingFraction_phi) /
                               cpm.packingFraction_phi * 100;

    return { cpm, furnas, difference_percent };
  }
}

