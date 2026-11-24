export type ScalarDimensionlessResult = {
  value: number;
  symbol: string;
  L_m?: number;
  resolvedFluid?: {
    rho_kg_m3?: number;
    mu_Pa_s?: number;
    Cp_J_kgK?: number;
    lambda?: number;
    nu_m2s?: number;
  };
};
