/** Detected composition characteristics for adaptive packing limits. */
export type CompositionCharacteristics = {
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
};
