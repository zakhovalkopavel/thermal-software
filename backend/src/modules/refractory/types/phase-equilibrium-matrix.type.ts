/** Reacted matrix of the body: shells of the reactive grains. */
export type PhaseEquilibriumMatrix = {
  /** Oxide composition of the matrix [wt%], Σ = 100 */
  composition: Record<string, number>;

  /** Matrix amount [% of the fired body] */
  percent: number;

  /** Notes about skipped (inert or unmodelled) phases */
  warnings: string[];
};
