/** Mapping of the legacy eutectic result onto the engine result. */
export const LEGACY_ENGINE_ADAPTER_CONSTANTS = {
  /** Mineral phase name of the legacy model when no rule matched */
  fallbackPhaseName: 'Mixed solid solution',

  /** `Name (formula)` as written by the legacy mineral-phase identification */
  mineralPhasePattern: /^(.*?)\s*\((.*)\)$/,

  /** Greek-letter polymorph prefix of legacy formulas, e.g. `α-Al₂O₃` */
  polymorphPrefixPattern: /^[α-ωΑ-Ω]-/,
} as const;
