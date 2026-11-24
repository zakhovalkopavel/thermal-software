/** Mass fractions, Σ = 1 ± 0.001. */
export type ElementalComposition = {
  C: number;
  H: number;
  O: number;
  N: number;
  S?: number;
  ash: number;
  moisture?: number;
};
