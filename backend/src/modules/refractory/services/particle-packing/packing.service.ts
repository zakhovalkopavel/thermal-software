import { Injectable } from '@nestjs/common';
import { PACKING_DEFAULTS } from '../../constants/packing-defaults.constants';
import type { CPMCalibration } from '../../types/cpm-calibration.type';
import { CompositionAnalyzer } from '../../utils/composition-analyzer';
import { CpmCalibrationResolve } from '../../utils/cpm-calibration-resolve';
import { FurnasPacking } from '../../utils/furnas-packing';
import { PackingFractions } from '../../utils/packing-fractions';

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
 * - Furnas, C.C. (1931) "Grading Aggregates - Mathematical Relations for Beds of Broken Solids"
 * - Wong, H.H.C. & Kwan, A.K.H. (2008) "Packing density of cementitious materials"
 * - Studart, A.R. et al. (2006) "Processing Routes to Macroporous Ceramics: A Review"
 * - Johansen, V. & Andersen, P.J. (1991) "Particle packing and concrete properties"
 */
@Injectable()
export class PackingService {

  /**
   * Calculate packing using Compressible Packing Model (CPM)
   *
   * Virtual packing formula: β_i = β₀ / (1 - K × c_i)
   * where c_i = compaction index = P/(P + P_ref)
   *
   * @param inputs Packing input parameters
   * @param calibration Optional calibration (models or custom values)
   * @returns Packing result with phi, porosity, and calibration metadata
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

    const volumeFractions = PackingFractions.massToVolumeFractions(massFractions, densities_kgm3);

    const beta0 = CpmCalibrationResolve.resolveBeta0(calibration);
    const K = calibration?.K ?? PACKING_DEFAULTS.CPM_K;
    const maxPhi = CpmCalibrationResolve.resolveMaxPhi(calibration, diameters_mm, volumeFractions);
    const denomFloor = calibration?.denomFloor ?? PACKING_DEFAULTS.DENOM_FLOOR;

    const compositionAnalysis = CompositionAnalyzer.analyzeComposition(
      diameters_mm,
      volumeFractions,
    );

    const compactionIndex = CpmCalibrationResolve.compactionIndex(compactionPressure_MPa);

    // Prevent singularity: denom = max(floor, 1 - K×c_i)
    const denom = Math.max(denomFloor, 1 - K * compactionIndex);
    const virtualPackingSingle = beta0 / denom;

    // Clamp to physically meaningful range [beta0, maxPhi]
    const virtualPacking = volumeFractions.map(() =>
      Math.min(maxPhi, Math.max(beta0, virtualPackingSingle)),
    );

    const weightedVP = volumeFractions.reduce((sum, vf, i) => sum + vf * virtualPacking[i], 0);

    // Simplified CPM: φ = weighted VP, clamp to [0, maxPhi]
    const phi = Math.max(0, Math.min(maxPhi, weightedVP));

    return {
      model: 'CPM' as const,
      packingFraction_phi: Number(phi.toFixed(3)),
      porosity_initial: Number((1 - phi).toFixed(3)),
      effectivePackingDensity: phi,
      calibration: {
        beta0,
        K,
        maxPhi,
        denomFloor,
        compactionIndex: Number(compactionIndex.toFixed(4)),
        autoDetected: calibration?.autoDetectMaxPhi === true,
      },
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
   * Calculate packing using Furnas sequential filling model.
   * @see FurnasPacking.calculate
   */
  calculateFurnas(
    inputs: { massFractions: number[]; densities_kgm3: number[]; diameters_mm: number[] },
    efficiencyFactor?: number,
  ) {
    return FurnasPacking.calculate(inputs, efficiencyFactor);
  }
}
