export type RawMaterialThermalPoint = {
  materialId: string;
  temperature_C: number;
  porosity: number;
  /** Effective λ at `porosity`. */
  lambda_WmK: number;
  cp_JkgK: number;
  /** Bulk density: library true density · (1 − P). */
  rho_kgm3: number;
  diffusivity_m2s: number;
};
