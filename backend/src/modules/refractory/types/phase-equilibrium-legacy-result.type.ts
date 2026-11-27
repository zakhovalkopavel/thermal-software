/** Result of the legacy eutectic (CAS cubic) phase-equilibrium model. */
export type PhaseEquilibriumLegacyResult = {
  /** Liquid phase: percent, mass [kg], bulk composition [wt%] and active components */
  liquid: {
    percent: number;
    mass: number;
    composition: Record<string, number>;
    components: Record<string, number>;
  };

  /** Solid phase: as liquid, plus the identified mineral phase names */
  solid: {
    percent: number;
    mass: number;
    composition: Record<string, number>;
    mineralPhases: string[];
    components: Record<string, number>;
  };

  /** Calculation metadata */
  metadata: {
    temperature: number;
    totalMass: number;
    eutecticTemperature: number;
    estimatedLiquidus: number;
    calculatedAt: Date;
  };

  /** Calculation warnings/notes */
  warnings: string[];
};
