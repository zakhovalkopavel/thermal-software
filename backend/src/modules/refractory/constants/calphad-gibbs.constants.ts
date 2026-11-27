/** Numerical settings for Engine C Gibbs minimisation (ideal liquid + stoichiometric solids). */
export const CALPHAD_GIBBS_CONSTANTS = {
  /** Softplus floor so liquid mole fractions never hit exactly zero */
  softplusFloor_mol: 1e-12,

  /** Penalty weight on the squared oxide mole residual [J/mol²] */
  massBalancePenalty: 1e10,

  /** Maximum accepted residual after optimisation [mol per 100 g batch] */
  maxResidual_mol: 1e-3,

  /** Nelder–Mead iteration budget */
  maxIterations: 800,

  /** Nelder–Mead convergence tolerance on the simplex */
  tolerance: 1e-8,

  /** Minimum liquid or solid share reported from the solve [% of matrix] */
  minReportedPhasePercent: 0.05,

  /** Oxides below this matrix share [wt%] are dropped from the component set */
  minOxideShare_wt: 0.5,
} as const;
