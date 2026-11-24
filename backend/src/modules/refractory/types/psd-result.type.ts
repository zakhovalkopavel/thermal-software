/** PSD calculation result. */
export type PSDResult = {
  /** Method used (Andreasen or Funk-Dinger) */
  method: 'Andreasen' | 'FunkDinger';

  /** Distribution modulus value used */
  q: number;

  /** Calculated mass fractions (decimal, 0-1) */
  massFractions: number[];

  /** Rounded mass fractions as percentages (0-100) */
  massFractionsRoundedPercent: number[];

  /** Effective minimum diameter (mm) */
  Dmin_mm: number;

  /** Effective maximum diameter (mm) */
  Dmax_mm: number;
};
