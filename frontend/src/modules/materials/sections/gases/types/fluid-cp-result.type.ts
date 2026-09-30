export type FluidCpResult = {
  Cp_J_kgK: number;
  Cv_J_kgK?: number;
  gamma?: number;
  molecularWeight_kg_mol: number;
  species?: string;
  T_K: number;
};
