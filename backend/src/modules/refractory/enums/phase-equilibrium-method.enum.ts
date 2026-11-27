/** Method that produced a phase-equilibrium result */
export enum PhaseEquilibriumMethod {
  /** Full CALPHAD Gibbs-energy minimisation */
  CALPHAD_FULL = 'calphad_full',
  /** CALPHAD with partially available excess-energy parameters */
  CALPHAD_PARTIAL_EXCESS = 'calphad_partial_excess',
  /** Liquid fraction anchored to a eutectic point */
  EUTECTIC_ANCHORED = 'eutectic_anchored',
  /** Liquid fraction estimated from the melting temperature */
  TM_ESTIMATE = 'tm_estimate',
  /** Legacy eutectic liquid-fraction model */
  LEGACY_EUTECTIC = 'legacy_eutectic',
  /** Legacy diagram model requested but no diagram is available */
  LEGACY_DIAGRAM_UNAVAILABLE = 'legacy_diagram_unavailable',
}
