/** Nested Nelder–Mead settings for Abdul associate / Mao ionic liquid speciation. */
export const LIQUID_SPECIATION_CONSTANTS = {
  softplusFloor_mol: 1e-12,
  /** Penalty on negative free-oxide residuals / composition mismatch [J] */
  balancePenalty: 1e8,
  /** Nested solve budget (kept modest: called inside the outer Gibbs `nelderMead`) */
  maxIterations: 80,
  tolerance: 1e-6,
  /** Missing Mao reciprocal corner °G uplift above oxide references [J/mol] */
  missingEndmemberUplift_Jmol: 5e5,
} as const;
