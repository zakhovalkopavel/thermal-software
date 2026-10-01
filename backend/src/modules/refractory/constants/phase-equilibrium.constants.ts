/** Eutectic temperature below which the liquid-fraction model returns no liquid [°C] */
export const EUTECTIC_TEMPERATURE_C = 1265;

/** Eutectic liquid composition used for liquid-phase enrichment [wt%] */
export const EUTECTIC_COMPOSITION: Readonly<Record<string, number>> = { SiO2: 34.8, Al2O3: 36.8, CaO: 28.4 };
