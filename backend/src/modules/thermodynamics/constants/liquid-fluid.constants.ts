/** Catalogue compoundId for liquid water (`fluid: 'water'` / `H2O` + `phase: 'liquid'`). */
export const LIQUID_FLUID = {
  waterCompoundId: 'water',
  /** Registry / alias keys that resolve to liquid water */
  waterFluidKeys: ['water', 'H2O'] as const,
} as const;
