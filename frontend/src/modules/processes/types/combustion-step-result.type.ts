import type { SpeciesValues } from './species-values.type';

export type CombustionStepResult = {
  tOut_K: number;
  excessAir: number;
  products: {
    moleFlows_mols: SpeciesValues;
    massFlows_kgs: SpeciesValues;
    moleFractions: SpeciesValues;
    massFractions: SpeciesValues;
  };
  mGas_kgs: number;
  charCarbon_kgs: number;
  ash_kgs: number;
  reactantEnthalpy_W: number;
  productEnthalpy_W: number;
  heatLoss_W: number;
  wgsKp: number | null;
  elementBalanceResidual: number;
};
