/** Liquidus calculation intermediate result. */
export type LiquidusResult = {
  /** Estimated liquidus temperature (°C) */
  temperature: number;

  /** Confidence level (0-1) */
  confidence: number;

  /** Method used for estimation */
  method: string;

  /** Calculation notes */
  notes?: string;
};
