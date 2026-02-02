/**
 * Material Library Interfaces
 *
 * Common interfaces and types for all material data files
 */

export interface ThermalProperties {
  thermalConductivity_WmK?: number;
  specificHeat_JkgK?: number;
  thermalExpansion_perK?: number;
}

export interface MechanicalProperties {
  crushingStrength_MPa?: number;
  modulusOfRupture_MPa?: number;
  youngModulus_GPa?: number;
  hardness_HV?: number; // Vickers Hardness
}

export interface ParticleSize {
  dMin_mm: number;
  dMax_mm: number;
  d50_mm: number;
}

/**
 * Base Material Entry Interface
 * All materials inherit from this interface
 */
export interface MaterialEntry {
  materialId: string;
  name: string;
  type: 'aggregate' | 'binder' | 'additive' | 'clay' | 'glass';
  materialGroup: string[]; // e.g., ['oxide'], ['carbide'], ['silicate', 'flux'], etc.
  orderNumber: number; // 1-10: common, 11-20: specialty, 21+: very special
  description: string;
  composition: Record<string, number>;
  rho_true_after_firing_kgm3: number;
  availableParticleSizes?: string[];
  particleSize?: ParticleSize;
  thermalProperties?: ThermalProperties;
  mechanicalProperties?: MechanicalProperties;
  chemicalShrinkage_volFrac: number;
  activationEnergy_Jmol: number;
  meltingPoint_C: number;
  sourceUrl?: string;
  supplier?: string;
  grade?: string;
  isActive: boolean;
}

/**
 * Material Group Types
 */
export type MaterialGroupType =
  | 'oxide'
  | 'carbide'
  | 'nitride'
  | 'boride'
  | 'silicate'
  | 'clay'
  | 'binder'
  | 'phosphate'
  | 'borate'
  | 'fluoride'
  | 'flux'
  | 'glass_former'
  | 'rare_earth'
  | 'hydroxide'
  | 'gel'
  | 'glass';

/**
 * Material Type Categories
 */
export type MaterialType = 'aggregate' | 'binder' | 'additive' | 'clay' | 'glass';

