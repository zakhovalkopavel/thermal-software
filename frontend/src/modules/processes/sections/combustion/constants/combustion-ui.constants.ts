export const COMBUSTION_UI = {
  modeParam: 'mode',
  excessAirSweep: { from: 1, to: 2, step: 0.05 },
  /** Product species always returned by the step results, in display order. */
  productSpecies: ['N2', 'O2', 'CO2', 'CO', 'H2O', 'H2', 'SO2'],
  bedProfileSpecies: ['O2', 'CO2', 'CO'],
  fractionDigits: 4,
  joulesPerMegajoule: 1e6,
  elementalSumTolerance: 0.001,
} as const;
