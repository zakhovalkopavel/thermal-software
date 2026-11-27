/** Threshold rule that marks a crystalline phase as present in a solid composition. */
export type CrystalIdentificationRule = {
  /** Stable identifier, e.g. `mullite` */
  phaseId: string;

  /** Display name */
  phase: string;

  /** Chemical formula */
  formula: string;

  /** Minimum oxide contents of the solid [wt%] (exclusive) */
  minWt: Record<string, number>;

  /** Minimum ratio of two oxide contents (exclusive), e.g. Al2O3/SiO2 > 1.5 */
  minRatio?: { numerator: string; denominator: string; value: number };

  /** Oxide whose content sets the relative amount of the phase */
  weightOxide: string;
};
