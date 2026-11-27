import { Injectable } from '@nestjs/common';
import { COMPOSITION_ANALYSIS_CONSTANTS } from '../../constants/composition-analysis.constants';
import { PACKING_DEFAULTS } from '../../constants/packing-defaults.constants';
import type { CPMCalibration } from '../../types/cpm-calibration.type';
import { CompositionAnalyzer } from '../../utils/composition-analyzer';
import { CpmCalibrationResolve } from '../../utils/cpm-calibration-resolve';
import { CpmPacking } from '../../utils/cpm-packing';
import { FurnasPacking } from '../../utils/furnas-packing';
import { PackingFractions } from '../../utils/packing-fractions';

/**
 * Packing Calculator Service - CPM and Furnas Models
 * Enhanced with research-backed calibration models
 *
 * Ported from: legacy/refractory/src/calculators/PackingCalculator.ts
 *
 * Implements two packing density models:
 * - Compressible Packing Model (CPM) by de Larrard / Stovall (linear packing
 *   density φ = min γ_i — depends on mass fractions and sizes)
 * - Furnas sequential filling model
 *
 * References:
 * - de Larrard, F. (1999) "Concrete Mixture Proportioning: A Scientific Approach"
 * - Stovall, T., de Larrard, F. & Buil, M. (1986) "Linear packing density model of grain mixtures"
 * - Furnas, C.C. (1931) "Grading Aggregates - Mathematical Relations for Beds of Broken Solids"
 * - Wong, H.H.C. & Kwan, A.K.H. (2008) "Packing density of cementitious materials"
 * - Studart, A.R. et al. (2006) "Processing Routes to Macroporous Ceramics: A Review"
 * - Johansen, V. & Andersen, P.J. (1991) "Particle packing and concrete properties"
 *
 * Algorithm: docs/algorithms/particle-packing/PACKING_MODELS.md
 */
@Injectable()
export class PackingService {
  /**
   * Compressible Packing Model (CPM).
   * Virtual packing β_i = β₀ / max(floor, 1 − K·c); φ = min_i γ_i from Stovall
   * linear packing over the volume fractions (mix masses and sizes).
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
    const sorted = PackingFractions.sortBySize(volumeFractions, diameters_mm);

    const compositionAnalysis = CompositionAnalyzer.analyzeComposition(diameters_mm, volumeFractions);
    const beta0Base = CpmCalibrationResolve.resolveBeta0(calibration);
    const betaBonus =
      calibration?.beta0 !== undefined
        ? 0
        : CompositionAnalyzer.microFillerBetaBonus(compositionAnalysis.microFillerPercent);
    const beta0 = Math.min(
      COMPOSITION_ANALYSIS_CONSTANTS.MICRO_FILLER_BETA_CAP,
      beta0Base + betaBonus,
    );
    const K = calibration?.K ?? PACKING_DEFAULTS.CPM_K;
    const maxPhi = CpmCalibrationResolve.resolveMaxPhi(calibration, diameters_mm, volumeFractions);
    const denomFloor = calibration?.denomFloor ?? PACKING_DEFAULTS.DENOM_FLOOR;
    const compactionIndex = CpmCalibrationResolve.compactionIndex(compactionPressure_MPa);
    const autoDetected =
      calibration?.autoDetectMaxPhi === true ||
      (calibration?.maxPhi === undefined &&
        calibration?.maxPhiModel === undefined &&
        calibration?.autoDetectMaxPhi !== false);

    const denom = Math.max(denomFloor, 1 - K * compactionIndex);
    const beta_i = Math.min(1, beta0 / denom);
    const virtualPacking = sorted.volumeFractions.map(() => beta_i);

    const solved = CpmPacking.solve(sorted.volumeFractions, virtualPacking, sorted.diameters);
    const phi = Math.max(0, Math.min(maxPhi, solved));

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
        autoDetected,
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
   * Furnas sequential filling packing model.
   * @see FurnasPacking.calculate
   */
  calculateFurnas(
    inputs: { massFractions: number[]; densities_kgm3: number[]; diameters_mm: number[] },
    efficiencyFactor?: number,
  ) {
    return FurnasPacking.calculate(inputs, efficiencyFactor);
  }
}
