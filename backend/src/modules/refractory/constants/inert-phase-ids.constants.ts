/**
 * Fired phases that do not react with the oxide matrix at firing temperature
 * (carbides, nitrides, carbon). They stay unreacted crystals and never enter the matrix.
 */
export const INERT_PHASE_IDS: ReadonlyArray<string> = [
  'SiC', 'TiC', 'B4C', 'WC', 'ZrC', 'NbC', 'TaC', 'Si3N4', 'TiN', 'BN', 'AlN', 'C',
];
