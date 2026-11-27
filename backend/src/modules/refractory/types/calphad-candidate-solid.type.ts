/**
 * Stoichiometric solid candidate for Engine C Gibbs minimisation.
 * `oxides` are moles of each oxide end-member per mole of the phase.
 */
export type CalphadCandidateSolid = {
  phaseId: string;
  phase: string;
  formula: string;
  /** Public compound-data id for `CompoundValueBuilder.forSolid` */
  compoundId: string;
  /** Oxide stoichiometry (moles of oxide per mole of phase) */
  oxides: Readonly<Record<string, number>>;
};
