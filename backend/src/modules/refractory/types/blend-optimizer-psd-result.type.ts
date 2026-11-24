/**
 * Intermediate PSD result used inside blend optimizer.
 * Same export name as the PSD calculator type, but a different shape —
 * import from this file path only (not re-exported from types/index).
 */
export type PSDResult = {
  /** Method used for PSD calculation */
  method: string;

  /** Mass fractions calculated */
  massFractions: number[];

  /** Rounded mass fractions in percent */
  massFractionsRoundedPercent: number[];

  /** Distribution modulus */
  q: number;
};
