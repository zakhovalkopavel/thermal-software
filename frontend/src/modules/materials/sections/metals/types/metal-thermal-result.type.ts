export type MetalThermalResult = {
  material: string;
  T_K: number;
  /** Omitted when T is outside this grade's table domain for λ. */
  lambda_WmK?: number;
  /** Present only for poly grades that define ε. */
  emissivity?: number;
  specificHeat_JkgK?: number;
  thermalExpansion_1e6K?: number;
  density_kgm3?: number;
  electricalResistivity_OhmM?: number;
  donors?: Record<string, unknown>;
  notes?: string[];
};
