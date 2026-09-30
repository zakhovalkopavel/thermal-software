export type RawMaterialThermalPoint = {
  materialId: string;
  temperature_C: number;
  porosity: number;
  lambda_WmK: number;
  cp_JkgK: number;
  /** Model value: 2500 · (1 − P), not the material's true density. */
  rho_kgm3: number;
  /** Model value, derived from the model density. */
  diffusivity_m2s: number;
};
