export const PROCESSES_UI = {
  wallLayer: { thicknessMin_mm: 0.1 },
  /** Materials routes opened by "View properties" for a wall layer. */
  materialRoutes: { metal: '/materials/metals', refractory: '/materials/refractories' },
  materialParam: 'material',
  /** Species of the wall / recuperator smoke composition DTO. */
  smokeSpecies: ['N2', 'O2', 'CO2', 'CO', 'H2O', 'H2'],
  gasFractionDecimals: 6,
  paths: { multilayerWall: '/processes/multilayer-wall', recuperator: '/processes/recuperator' },
  materialLookup: { defaultTemperature_C: 500 },
} as const;
