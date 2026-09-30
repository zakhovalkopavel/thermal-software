export type GasPropertiesResult = {
  Cp_J_kgK: number;
  H_J_mol: number;
  rho_kg_m3: number;
  molecularWeight_kg_mol: number;
  mu_Pa_s: number;
  lambda: number;
  Pr: number;
  diffusion: Record<string, number>;
};
