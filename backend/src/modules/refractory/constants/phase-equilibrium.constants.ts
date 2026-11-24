/** Phase-equilibrium eutectic anchors for the liquid-fraction model. */
export const PHASE_EQUILIBRIUM_CONSTANTS = {
  /** Eutectic temperature below which the liquid-fraction model returns no liquid [°C] */
  EUTECTIC_TEMPERATURE_C: 1265,
  /** Eutectic liquid composition used for liquid-phase enrichment [wt%] */
  EUTECTIC_COMPOSITION: { SiO2: 34.8, Al2O3: 36.8, CaO: 28.4 } as Readonly<Record<string, number>>,
} as const;
