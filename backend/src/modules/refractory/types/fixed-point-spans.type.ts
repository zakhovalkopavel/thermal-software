/** Temperature spans between fixed points. */
export type FixedPointSpans = {
  /** Melting to strain point */
  meltingToStrain_C: number;

  /** Working to softening */
  workingToSoftening_C: number;

  /** Softening to annealing */
  softeningToAnnealing_C: number;

  /** Annealing to strain */
  annealingToStrain_C: number;
};
