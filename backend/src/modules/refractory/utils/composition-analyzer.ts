/**
 * Composition characteristics detection for adaptive packing limits
 *
 * Analyzes particle size distribution and component properties to automatically
 * select appropriate φ_max based on actual mix composition.
 *
 * References:
 * - Studart et al. (2006): Micro-fillers enable higher packing
 * - de Larrard (1999): Size distribution affects packing capacity
 * - Pileggi et al. (2001): Refractory castable classification
 */

import { COMPOSITION_ANALYSIS_CONSTANTS } from '../constants/packing-constants';

/**
 * Detected composition characteristics
 */
export interface CompositionCharacteristics {
  /** Has significant micro-filler content (<0.1 mm) */
  hasMicroFillers: boolean;

  /** Micro-filler percentage by mass */
  microFillerPercent: number;

  /** Detected PSD type */
  psdType: 'mono' | 'binary' | 'ternary' | 'quaternary_plus' | 'continuous';

  /** Size ratio spread (largest/smallest) */
  sizeRatioSpread: number;

  /** Is castable-type composition (multiple fractions) */
  isCastable: boolean;

  /** Estimated packing quality based on size distribution */
  packingQuality: 'poor' | 'fair' | 'good' | 'excellent';

  /** Recommended φ_max based on composition */
  recommendedMaxPhi: number;

  /** Confidence score (0-1) for recommendation */
  confidence: number;

  /** Explanation of recommendation */
  explanation: string;
}

/**
 * Composition-based limit selector
 */
export class CompositionAnalyzer {
  /**
   * Analyze composition and recommend φ_max limit
   *
   * @param diameters_mm - Particle sizes for each fraction
   * @param massFractions - Mass fraction of each component (should sum to 1)
   * @returns Composition characteristics with recommended φ_max
   */
  static analyzeComposition(diameters_mm: number[], massFractions: number[]): CompositionCharacteristics {
    // Validate inputs
    if (diameters_mm.length !== massFractions.length) {
      throw new Error('Diameter and mass fraction arrays must have same length');
    }

    // Calculate composition metrics
    const sizeRatioSpread = Math.max(...diameters_mm) / Math.min(...diameters_mm);
    const microFillerContent = this.detectMicroFillers(diameters_mm, massFractions);
    const psdType = this.detectPSDType(diameters_mm.length);
    const packingQuality = this.assessPackingQuality(diameters_mm, massFractions);

    // Determine if castable composition
    const isCastable = diameters_mm.length >= 2;

    // Select φ_max based on characteristics
    const recommendation = this.selectMaxPhi(
      microFillerContent,
      psdType,
      sizeRatioSpread,
      packingQuality,
      isCastable
    );

    return {
      hasMicroFillers: microFillerContent.percent > COMPOSITION_ANALYSIS_CONSTANTS.MICRO_FILLER_SIGNIFICANT_PERCENT,
      microFillerPercent: microFillerContent.percent,
      psdType,
      sizeRatioSpread,
      isCastable,
      packingQuality,
      recommendedMaxPhi: recommendation.maxPhi,
      confidence: recommendation.confidence,
      explanation: recommendation.explanation,
    };
  }

  /**
   * Detect micro-filler content (particles < threshold mm)
   */
  private static detectMicroFillers(diameters_mm: number[], massFractions: number[]) {
    const microFillerThreshold = COMPOSITION_ANALYSIS_CONSTANTS.MICRO_FILLER_THRESHOLD_MM;
    let microFillerMass = 0;

    for (let i = 0; i < diameters_mm.length; i++) {
      if (diameters_mm[i] < microFillerThreshold) {
        microFillerMass += massFractions[i];
      }
    }

    return {
      percent: microFillerMass * 100,
      exists: microFillerMass > 0,
    };
  }

  /**
   * Detect PSD type (mono, binary, ternary, etc.)
   */
  private static detectPSDType(numFractions: number): CompositionCharacteristics['psdType'] {
    if (numFractions === 1) return 'mono';
    if (numFractions === 2) return 'binary';
    if (numFractions === 3) return 'ternary';
    if (numFractions === 4) return 'quaternary_plus';
    return 'continuous';
  }

  /**
   * Assess packing quality based on size distribution
   */
  private static assessPackingQuality(
    diameters_mm: number[],
    massFractions: number[]
  ): CompositionCharacteristics['packingQuality'] {
    const sizeRatio = Math.max(...diameters_mm) / Math.min(...diameters_mm);
    const varianceScore = this.calculateDistributionVariance(massFractions);

    const thresholds = COMPOSITION_ANALYSIS_CONSTANTS.PSD_QUALITY_THRESHOLDS;

    // Check in order from most restrictive to least
    if (sizeRatio < thresholds.POOR.maxSizeRatio || varianceScore > thresholds.POOR.maxVariance) {
      return 'poor';
    }

    if (sizeRatio < thresholds.FAIR.maxSizeRatio || varianceScore > thresholds.FAIR.maxVariance) {
      return 'fair';
    }

    if (sizeRatio < thresholds.GOOD.maxSizeRatio) {
      return 'good';
    }

    // Excellent: wide size range with good distribution
    return 'excellent';
  }

  /**
   * Calculate variance of mass distribution (0 = uniform, 1 = all in one)
   */
  private static calculateDistributionVariance(massFractions: number[]): number {
    const n = massFractions.length;
    const mean = 1 / n;
    const variance = massFractions.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    return Math.sqrt(variance);
  }

  /**
   * Select φ_max based on composition characteristics
   */
  private static selectMaxPhi(
    microFillerContent: { percent: number; exists: boolean },
    psdType: CompositionCharacteristics['psdType'],
    sizeRatio: number,
    packingQuality: CompositionCharacteristics['packingQuality'],
    isCastable: boolean
  ): { maxPhi: number; confidence: number; explanation: string } {
    const constants = COMPOSITION_ANALYSIS_CONSTANTS;
    const combAdj = constants.COMBINATION_ADJUSTMENTS;

    // Determine filler category
    let fillerCategory: keyof typeof combAdj = 'noFillers';
    if (microFillerContent.percent > constants.MICRO_FILLER_THRESHOLDS.SIGNIFICANT.percent) {
      fillerCategory = 'significantFillers';
    } else if (microFillerContent.percent > constants.MICRO_FILLER_THRESHOLDS.SOME.percent) {
      fillerCategory = 'someFillers';
    }

    // Get φ_max and confidence from combination matrix
    const adjustments = combAdj[fillerCategory];
    const maxPhi = adjustments[packingQuality];

    // Determine confidence based on filler content and PSD quality
    let confidence = 0.75;
    if (microFillerContent.percent > constants.MICRO_FILLER_THRESHOLDS.HIGH.percent) {
      confidence = constants.MICRO_FILLER_THRESHOLDS.HIGH.confidence;
    } else if (microFillerContent.percent > constants.MICRO_FILLER_THRESHOLDS.SIGNIFICANT.percent) {
      confidence = constants.MICRO_FILLER_THRESHOLDS.SIGNIFICANT.confidence;
    } else if (microFillerContent.percent > constants.MICRO_FILLER_THRESHOLDS.SOME.percent) {
      confidence = constants.MICRO_FILLER_THRESHOLDS.SOME.confidence;
    } else if (packingQuality === 'excellent') {
      confidence = constants.PSD_QUALITY_THRESHOLDS.EXCELLENT.confidence;
    } else if (packingQuality === 'good') {
      confidence = constants.PSD_QUALITY_THRESHOLDS.GOOD.confidence;
    } else if (packingQuality === 'fair') {
      confidence = constants.PSD_QUALITY_THRESHOLDS.FAIR.confidence;
    } else {
      confidence = constants.PSD_QUALITY_THRESHOLDS.POOR.confidence;
    }

    // Generate explanation
    let explanation = '';
    if (microFillerContent.percent > constants.MICRO_FILLER_THRESHOLDS.HIGH.percent) {
      explanation = `High micro-filler content (${microFillerContent.percent.toFixed(1)}%): allow ${maxPhi} (high-performance range)`;
    } else if (microFillerContent.percent > constants.MICRO_FILLER_THRESHOLDS.SIGNIFICANT.percent) {
      explanation = `Significant micro-fillers (${microFillerContent.percent.toFixed(1)}%): use ${maxPhi} (high-performance)`;
    } else if (microFillerContent.percent > constants.MICRO_FILLER_THRESHOLDS.SOME.percent) {
      explanation = `Some micro-fillers (${microFillerContent.percent.toFixed(1)}%): use ${maxPhi} (dense castable+)`;
    } else if (packingQuality === 'excellent') {
      explanation = `Excellent PSD without micro-fillers: use ${maxPhi} (optimized distribution)`;
    } else if (packingQuality === 'good') {
      explanation = `Good PSD: use ${maxPhi} (standard dense castable)`;
    } else if (packingQuality === 'fair') {
      explanation = `Fair PSD: use ${maxPhi} (typical concrete range)`;
    } else {
      explanation = `Poor PSD: use ${maxPhi} (conservative limit)`;
    }

    return {
      maxPhi,
      confidence,
      explanation,
    };
  }
}

