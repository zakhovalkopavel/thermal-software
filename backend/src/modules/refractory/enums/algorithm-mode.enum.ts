/** Algorithm used for the full phase-equilibrium calculation */
export enum AlgorithmMode {
  /** CALPHAD-based equilibrium (default) */
  CALPHAD = 'calphad',
  /** Legacy eutectic / diagram liquid-fraction model */
  LEGACY = 'legacy',
  /** Run CALPHAD and legacy side by side and return both */
  COMPARE = 'compare',
}
