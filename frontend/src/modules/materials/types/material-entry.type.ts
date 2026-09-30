import type { MaterialGroup } from './material-group.type';
import type { MaterialType } from './material-type.type';

export type MaterialEntry = {
  materialId: string;
  name: string;
  type: MaterialType;
  materialGroup: MaterialGroup[];
  orderNumber: number;
  description: string;
  composition: Record<string, number>;
  rho_true_after_firing_kgm3: number;
  availableParticleSizes?: string[];
  particleSize?: { dMin_mm: number; dMax_mm: number; d50_mm: number };
  thermalProperties?: {
    thermalConductivity_WmK?: number;
    specificHeat_JkgK?: number;
    thermalExpansion_perK?: number;
  };
  mechanicalProperties?: {
    crushingStrength_MPa?: number;
    modulusOfRupture_MPa?: number;
    youngModulus_GPa?: number;
    hardness_HV?: number;
  };
  chemicalShrinkage_volFrac: number;
  activationEnergy_Jmol: number;
  meltingPoint_C: number;
  sourceUrl?: string;
  supplier?: string;
  grade?: string;
};
