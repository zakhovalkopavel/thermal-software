/** Phase-equilibrium limits, defaults and legacy eutectic anchors. */
export const PHASE_EQUILIBRIUM_CONSTANTS = {
  /** Eutectic temperature below which the liquid-fraction model returns no liquid [°C] */
  EUTECTIC_TEMPERATURE_C: 1265,
  /** Eutectic liquid composition used for liquid-phase enrichment [wt%] */
  EUTECTIC_COMPOSITION: { SiO2: 34.8, Al2O3: 36.8, CaO: 28.4 } as Readonly<Record<string, number>>,
  /** Lowest supported firing temperature [°C] */
  minTemperature_C: 500,
  /** Highest supported firing temperature [°C] */
  maxTemperature_C: 2000,
  /** Default hold time at temperature [h] */
  defaultHoldTime_hours: 2,
  /** Default total mass of the mix [kg] */
  defaultTotalMass: 1,
  /** log10 viscosity [Pa·s] at the annealing point used as softening criterion */
  annealingLogViscosity: 12,
  /** Tolerance of the mineralogy mass-balance remainder [wt%] */
  mineralogyRemainderTolerance_wt: 0.5,
} as const;
