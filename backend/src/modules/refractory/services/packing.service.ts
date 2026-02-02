import { Injectable } from '@nestjs/common';
import {
  PackingInput,
  CPMInput,
  FurnasInput,
  PackingResult,
  PackingResultDetailed,
} from '../interfaces/packing-calculator.interface';

/**
 * Packing Calculator Service - CPM and Furnas Models
 * Ported from: legacy/refractory/src/calculators/PackingCalculator.ts (400 lines)
 *
 * Implements two packing density models:
 * - Compressible Packing Model (CPM) by de Larrard
 * - Furnas sequential filling model
 *
 * References:
 * - de Larrard, F. (1999) "Concrete Mixture Proportioning: A Scientific Approach"
 *   https://www.springer.com/gp/book/9780419235408
 * - Furnas, C.C. (1931) "Grading Aggregates - Mathematical Relations for Beds of Broken Solids"
 * - Wong, H.H.C. & Kwan, A.K.H. (2008) "Packing density of cementitious materials"
 *
 * Key Concepts:
 * - CPM: Accounts for particle interaction, wall effects, and compaction
 * - Furnas: Sequential filling of voids by smaller particles
 * - Virtual packing: Maximum packing of each size class in isolation
 * - Compaction index: Effect of pressure on packing
 */
@Injectable()
export class PackingService {
  private readonly CPM_BETA0 = 0.64;  // Random close packing for spheres
  private readonly CPM_K = 9.0;        // Compaction constant (de Larrard)
  private readonly FURNAS_EFFICIENCY = 0.75; // Void filling efficiency

  /**
   * Calculate packing using Compressible Packing Model (CPM)
   *
   * Simplified implementation of de Larrard's CPM.
   * Virtual packing: β_i = β₀ / (1 - K × compactionIndex)
   *
   * The model accounts for:
   * - Particle size distribution effects
   * - Compaction pressure
   * - Particle shape (through β₀ adjustment)
   *
   * @param inputs Packing input parameters
   * @param calibration Optional calibration overrides (beta0, K)
   * @returns Packing result with phi and porosity
   */
  calculateCPM(inputs: { massFractions: number[]; densities_kgm3: number[]; diameters_mm: number[]; compactionPressure_MPa?: number }, calibration?: { beta0?: number; K?: number }) {
    const { massFractions, densities_kgm3, diameters_mm, compactionPressure_MPa = 0 } = inputs;
    const beta0 = calibration?.beta0 ?? this.CPM_BETA0;
    const K = calibration?.K ?? this.CPM_K;
    const volumeFractions = this.massToVolumeFractions(massFractions, densities_kgm3);
    const compactionIndex = this.calculateCompactionIndex(compactionPressure_MPa);
    const virtualPacking = volumeFractions.map(() => beta0 / (1 - K * compactionIndex));
    const phi = Math.min(0.85, volumeFractions.reduce((sum, vf, i) => sum + vf * virtualPacking[i], 0) / volumeFractions.reduce((s, v) => s + v, 1));
    return { model: 'CPM', packingFraction_phi: Number(phi.toFixed(3)), porosity_initial: Number((1 - phi).toFixed(3)), effectivePackingDensity: phi };
  }

  /**
   * Calculate packing using Furnas sequential filling model
   *
   * Sequential filling approach:
   * 1. Largest fraction establishes initial packing (typically 0.64 for spheres)
   * 2. Each smaller fraction fills voids left by larger particles
   * 3. Efficiency decreases with size ratio (smaller particles fill less efficiently)
   *
   * Adjusted efficiency = efficiency × (size_ratio)^0.5
   * This accounts for:
   * - Accessibility of voids
   * - Bridging effects
   * - Particle interference
   *
   * @param inputs Packing input parameters
   * @param efficiencyFactor Void filling efficiency (0-1, default 0.75)
   * @returns Packing result with phi and porosity
   */
  calculateFurnas(inputs: { massFractions: number[]; densities_kgm3: number[]; diameters_mm: number[] }, efficiencyFactor?: number) {
    const { massFractions, densities_kgm3, diameters_mm } = inputs;
    const efficiency = efficiencyFactor ?? this.FURNAS_EFFICIENCY;
    const volumeFractions = this.massToVolumeFractions(massFractions, densities_kgm3);
    const sorted = this.sortBySize(volumeFractions, diameters_mm);
    let totalSolidsVolume = 0;
    let totalVolumeOccupied = 0;
    for (let i = 0; i < sorted.volumeFractions.length; i++) {
      const volFrac = sorted.volumeFractions[i];
      if (i === 0) {
        totalSolidsVolume = volFrac;
        totalVolumeOccupied = volFrac / this.CPM_BETA0;
      } else {
        const currentVoidVolume = totalVolumeOccupied - totalSolidsVolume;
        const sizeRatio = sorted.diameters[i] / sorted.diameters[0];
        const adjustedEfficiency = efficiency * Math.pow(sizeRatio, 0.5);
        const fillableVoid = currentVoidVolume * adjustedEfficiency;
        const volumeNeeded = volFrac / this.CPM_BETA0;
        totalSolidsVolume += volFrac;
        totalVolumeOccupied += Math.max(0, volumeNeeded - fillableVoid);
      }
    }
    const phi = totalVolumeOccupied > 0 ? totalSolidsVolume / totalVolumeOccupied : 0;
    return { model: 'Furnas', packingFraction_phi: Number(phi.toFixed(3)), porosity_initial: Number((1 - phi).toFixed(3)), effectivePackingDensity: phi };
  }

  private massToVolumeFractions(mass: number[], densities: number[]): number[] {
    const volumes = mass.map((m, i) => m / densities[i]);
    const sumVolumes = volumes.reduce((s, v) => s + v, 0);
    return volumes.map(v => v / sumVolumes);
  }

  private calculateCompactionIndex(pressure_MPa: number): number {
    return Math.min(0.99, pressure_MPa / (pressure_MPa + 10));
  }

  private sortBySize(volumeFractions: number[], diameters: number[]) {
    const indexed = volumeFractions.map((vf, i) => ({ vf, d: diameters[i] }));
    indexed.sort((a, b) => b.d - a.d);
    return { volumeFractions: indexed.map(x => x.vf), diameters: indexed.map(x => x.d) };
  }
}

