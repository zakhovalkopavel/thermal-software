import { Injectable } from '@nestjs/common';
import {
  PackingInput,
  CPMInput,
  FurnasInput,
  PackingResult,
  PackingResultDetailed,
} from '../interfaces/packing-calculator.interface';
import { Beta0Model, MaxPhiModel } from '../enums/packing-models.enum';
import {
  BETA0_VALUES,
  MAX_PHI_VALUES,
  PACKING_DEFAULTS,
} from '../constants/packing-constants';
import { CompositionAnalyzer } from '../utils/composition-analyzer';

// Re-export enums for convenience
export { Beta0Model, MaxPhiModel };

/**
 * CPM calibration parameters with research-backed models
 */
export interface CPMCalibration {
  /** Particle shape model (determines β₀) - default: ANGULAR (typical refractory) */
  beta0Model?: Beta0Model;
  /** Custom β₀ override (if provided, ignores beta0Model) */
  beta0?: number;
  /** Compaction coefficient K - default: 9.0 (de Larrard 1999) */
  K?: number;
  /** Maximum packing fraction model - default: DENSE_CASTABLE (φ = 0.76) */
  maxPhiModel?: MaxPhiModel;
  /** Custom φ_max override (if provided, ignores maxPhiModel) */
  maxPhi?: number;
  /**
   * Auto-detect φ_max based on composition characteristics
   * If true: analyzes particle sizes and mass fractions to select appropriate limit
   * Considers: micro-fillers, PSD type, size distribution quality
   * Overrides maxPhiModel if provided, but can be overridden by explicit maxPhi
   */
  autoDetectMaxPhi?: boolean;
  /**
   * Denominator stability floor - default: 0.05 (allows ~95% of P_crit)
   * Prevents singularity in β₀/(1-K·c_i) when pressure approaches critical value
   * Research range: 0.01–0.10 (Fennis 2011, concrete software practice)
   */
  denomFloor?: number;
}

/**
 * Packing Calculator Service - CPM and Furnas Models
 * Enhanced with research-backed calibration models
 *
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
 * - Studart, A.R. et al. (2006) "Processing Routes to Macroporous Ceramics: A Review"
 * - Johansen, V. & Andersen, P.J. (1991) "Particle packing and concrete properties"
 *
 * Key Concepts:
 * - CPM: Accounts for particle interaction, wall effects, and compaction
 * - Furnas: Sequential filling of voids by smaller particles
 * - Virtual packing: Maximum packing of each size class in isolation
 * - Compaction index: Effect of pressure on packing
 */
@Injectable()
export class PackingService {

  /**
   * Calculate packing using Compressible Packing Model (CPM)
   *
   * Enhanced with research-backed calibration models for:
   * - Particle shape (β₀): spherical, sub-angular, angular, flaky
   * - Maximum packing (φ_max): theoretical, typical, dense castable, high-performance
   * - Numerical stability (denominator floor prevents singularities)
   *
   * Virtual packing formula: β_i = β₀ / (1 - K × c_i)
   * where c_i = compaction index = P/(P + P_ref)
   *
   * Critical pressure (singularity): P_crit ≈ P_ref × (1/K) / (1 - 1/K)
   * With K=9, P_ref=10 MPa → P_crit ≈ 12.5 MPa
   * denomFloor=0.05 allows up to ~95% of P_crit
   *
   * The model accounts for:
   * - Particle size distribution effects
   * - Compaction pressure (via compaction index)
   * - Particle shape (via β₀ model selection)
   *
   * @param inputs Packing input parameters
   * @param calibration Optional calibration (models or custom values)
   * @returns Packing result with phi, porosity, and calibration metadata
   *
   * @example
   * // Default (angular particles, dense castable φ_max=0.76)
   * service.calculateCPM({ massFractions, densities_kgm3, diameters_mm });
   *
   * @example
   * // Spherical particles, high-performance cap
   * service.calculateCPM(inputs, {
   *   beta0Model: Beta0Model.SPHERICAL,
   *   maxPhiModel: MaxPhiModel.HIGH_PERFORMANCE
   * });
   *
   * @example
   * // Legacy behavior (0.85 cap, spherical β₀=0.64)
   * service.calculateCPM(inputs, {
   *   beta0Model: Beta0Model.SPHERICAL,
   *   maxPhiModel: MaxPhiModel.LEGACY_CONSERVATIVE
   * });
   *
   * @example
   * // Full custom calibration
   * service.calculateCPM(inputs, {
   *   beta0: 0.58,
   *   K: 10.5,
   *   maxPhi: 0.78,
   *   denomFloor: 0.02
   * });
   */
  calculateCPM(
    inputs: {
      massFractions: number[];
      densities_kgm3: number[];
      diameters_mm: number[];
      compactionPressure_MPa?: number;
    },
    calibration?: CPMCalibration,
  ) {
    const { massFractions, densities_kgm3, diameters_mm, compactionPressure_MPa = 0 } = inputs;

    // Convert mass to volume fractions first (needed for composition analysis)
    const volumeFractions = this.massToVolumeFractions(massFractions, densities_kgm3);

    // Resolve calibration parameters (models or custom values)
    const beta0 = this.resolveBeta0(calibration);
    const K = calibration?.K ?? PACKING_DEFAULTS.CPM_K;
    const maxPhi = this.resolveMaxPhi(calibration, diameters_mm, volumeFractions);
    const denomFloor = calibration?.denomFloor ?? PACKING_DEFAULTS.DENOM_FLOOR;

    // Detect composition characteristics (for information/diagnostics)
    const compositionAnalysis = CompositionAnalyzer.analyzeComposition(
      diameters_mm,
      volumeFractions,
    );


    // Calculate compaction index
    const compactionIndex = this.calculateCompactionIndex(compactionPressure_MPa);

    // Calculate virtual packing with stability floor
    // Prevent singularity: denom = max(floor, 1 - K×c_i)
    const denom = Math.max(denomFloor, 1 - K * compactionIndex);
    const virtualPackingSingle = beta0 / denom;

    // Clamp to physically meaningful range [beta0, maxPhi]
    // (virtual packing cannot be less than β₀ or exceed φ_max)
    const virtualPacking = volumeFractions.map(() =>
      Math.min(maxPhi, Math.max(beta0, virtualPackingSingle)),
    );

    // Calculate weighted virtual packing
    const weightedVP = volumeFractions.reduce((sum, vf, i) => sum + vf * virtualPacking[i], 0);

    // Final packing fraction (simplified CPM: φ = weighted VP)
    // Clamp to [0, maxPhi]
    const phi = Math.max(0, Math.min(maxPhi, weightedVP));

    return {
      model: 'CPM' as const,
      packingFraction_phi: Number(phi.toFixed(3)),
      porosity_initial: Number((1 - phi).toFixed(3)),
      effectivePackingDensity: phi,
      // Add calibration metadata for traceability
      calibration: {
        beta0,
        K,
        maxPhi,
        denomFloor,
        compactionIndex: Number(compactionIndex.toFixed(4)),
        autoDetected: calibration?.autoDetectMaxPhi === true,
      },
      // Add composition analysis for diagnostics
      composition: {
        hasMicroFillers: compositionAnalysis.hasMicroFillers,
        microFillerPercent: Number(compositionAnalysis.microFillerPercent.toFixed(1)),
        psdType: compositionAnalysis.psdType,
        packingQuality: compositionAnalysis.packingQuality,
        recommendedMaxPhi: Number(compositionAnalysis.recommendedMaxPhi.toFixed(4)),
        explanation: compositionAnalysis.explanation,
      },
    };
  }

  /**
   * Resolve β₀ from model or custom value
   * Priority: custom override > model selection > default (ANGULAR)
   */
  private resolveBeta0(calibration?: CPMCalibration): number {
    // Custom override takes precedence
    if (calibration?.beta0 !== undefined) {
      return calibration.beta0;
    }

    // Use model (default: ANGULAR for typical refractory)
    const model = calibration?.beta0Model ?? PACKING_DEFAULTS.DEFAULT_BETA0_MODEL;
    return BETA0_VALUES[model];
  }

  /**
   * Resolve φ_max from model, auto-detection, or custom value
   * Priority: custom override > auto-detection > model selection > default
   */
  private resolveMaxPhi(
    calibration: CPMCalibration | undefined,
    diameters_mm: number[],
    volumeFractions: number[],
  ): number {
    // Custom override takes highest priority
    if (calibration?.maxPhi !== undefined) {
      return calibration.maxPhi;
    }

    // Auto-detect based on composition if requested
    if (calibration?.autoDetectMaxPhi === true) {
      const analysis = CompositionAnalyzer.analyzeComposition(diameters_mm, volumeFractions);
      return analysis.recommendedMaxPhi;
    }

    // Use model (default: DENSE_CASTABLE = 0.76, research-backed for vibrated castables)
    const model = calibration?.maxPhiModel ?? PACKING_DEFAULTS.DEFAULT_MAX_PHI_MODEL;
    return MAX_PHI_VALUES[model];
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
    const efficiency = efficiencyFactor ?? PACKING_DEFAULTS.FURNAS_EFFICIENCY;
    const volumeFractions = this.massToVolumeFractions(massFractions, densities_kgm3);
    const sorted = this.sortBySize(volumeFractions, diameters_mm);

    // Use default angular beta0 for Furnas (typical refractory)
    const beta0 = BETA0_VALUES[PACKING_DEFAULTS.DEFAULT_BETA0_MODEL];

    let totalSolidsVolume = 0;
    let totalVolumeOccupied = 0;
    for (let i = 0; i < sorted.volumeFractions.length; i++) {
      const volFrac = sorted.volumeFractions[i];
      if (i === 0) {
        totalSolidsVolume = volFrac;
        totalVolumeOccupied = volFrac / beta0;
      } else {
        const currentVoidVolume = totalVolumeOccupied - totalSolidsVolume;
        const sizeRatio = sorted.diameters[i] / sorted.diameters[0];
        const adjustedEfficiency = efficiency * Math.pow(sizeRatio, 0.5);
        const fillableVoid = currentVoidVolume * adjustedEfficiency;
        const volumeNeeded = volFrac / beta0;
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

  /**
   * Calculate critical pressure where CPM formula becomes singular
   *
   * Formula: P_crit ≈ P_ref × (1/K) / (1 - 1/K)
   *
   * At P_crit, the denominator (1 - K×c_i) → 0, causing β_i → ∞
   *
   * Internal utility for calibration and diagnostics.
   *
   * @param K - Compaction coefficient
   * @param P_ref - Reference pressure in MPa
   * @returns Critical pressure in MPa
   */
  private calculateCriticalPressure(K: number, P_ref: number): number {
    return P_ref * (1 / K) / (1 - 1 / K);
  }

  /**
   * Calculate maximum allowed compaction index based on denominator floor
   *
   * Formula: c_i_max = (1 - denomFloor) / K
   *
   * This ensures the denominator (1 - K×c_i) stays above the floor value,
   * preventing singularities in the virtual packing calculation.
   *
   * Internal utility for calibration validation.
   *
   * @param K - Compaction coefficient
   * @param denomFloor - Minimum allowed denominator value
   * @returns Maximum safe compaction index
   */
  private calculateMaxCompactionIndex(K: number, denomFloor: number): number {
    return (1 - denomFloor) / K;
  }

  /**
   * Calculate allowed pressure as percentage of critical pressure
   *
   * @param K - Compaction coefficient
   * @param denomFloor - Minimum allowed denominator value
   * @returns Percentage of P_crit that is allowed (0-100)
   */
  private calculateAllowedPressurePercent(K: number, denomFloor: number): number {
    const maxCI = this.calculateMaxCompactionIndex(K, denomFloor);
    const criticalCI = 1 / K;
    return (maxCI / criticalCI) * 100;
  }
}
