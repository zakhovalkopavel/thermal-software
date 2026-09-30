export type PureGasPropertyRow = {
  gas: string;
  T_K: number;
  Cp_J_kgK?: number;
  Cv_J_kgK?: number;
  gamma?: number;
  molecularWeight_kg_mol?: number;
  mu_Pa_s?: number;
  nu_m2s?: number;
  rho_kg_m3?: number;
  lambda_WmK?: number;
  Pr?: number;
  errors: unknown[];
};
