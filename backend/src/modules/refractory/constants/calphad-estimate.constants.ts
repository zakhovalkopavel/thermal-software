/** Tuning of the CALPHAD estimate ladder (rungs 3–5: eutectic anchored, Tm estimate). */
export const CALPHAD_ESTIMATE_CONSTANTS = {
  /** Oxides below this share of the matrix [wt%] are ignored when looking up a eutectic */
  minOxideShare_wt: 0.5,

  /** Smallest liquidus − solidus interval of the eutectic-anchored model [K] */
  eutecticLiquidusSpan_K: 200,

  /** Solidus offset below the lowest component melting point in the Tm estimate [K] */
  tmSolidusOffset_K: 50,

  /** Smallest liquidus − solidus interval, avoids a division by zero [K] */
  minTemperatureSpan_K: 1,

  /** Liquid or solid below this share of the matrix [%] is treated as absent */
  minPhasePercent: 0.01,

  /** Components below this share [wt%] are dropped from reported compositions */
  minReportedShare_wt: 0.01,

  /** Total wt% of the matrix composition that counts as an empty matrix */
  emptyCompositionTotal: 0,
} as const;
