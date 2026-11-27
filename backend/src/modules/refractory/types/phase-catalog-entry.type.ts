/** Stoichiometry of a library crystalline phase for mineralogy mass balance. */
export type PhaseCatalogEntry = {
  phaseId: string;
  phase: string;
  formula: string;
  /** Oxide moles per mole of phase (for fired-basis oxide accounting) */
  oxides: Readonly<Record<string, number>>;
  /** Optional upper temperature of intrinsic stability [°C] */
  stableBelow_C?: number;
  /** True for carbides / nitrides / graphite that never enter the matrix */
  inert?: boolean;
};
