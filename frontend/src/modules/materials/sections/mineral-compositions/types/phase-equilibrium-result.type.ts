export type PhaseEquilibriumResult = {
  liquid: { percent: number; mass: number; composition: Record<string, number> };
  solid: { percent: number; mass: number; composition: Record<string, number>; mineralPhases: string[] };
  metadata: {
    temperature: number;
    totalMass: number;
    eutecticTemperature: number;
    estimatedLiquidus: number;
  };
  warnings: string[];
};
