import type { ReferencePropertyField } from '../types/reference-property-field.type';

export const REFERENCE_PROPERTY_FIELDS: ReferencePropertyField[] = [
  { key: 'thermalConductivity', label: 'λ', unit: 'W/(m·K)', read: (e) => e.thermalProperties?.thermalConductivity_WmK },
  { key: 'specificHeat', label: 'Cp', unit: 'J/(kg·K)', read: (e) => e.thermalProperties?.specificHeat_JkgK },
  { key: 'thermalExpansion', label: 'α', unit: '1/K', digits: 3, read: (e) => e.thermalProperties?.thermalExpansion_perK },
  { key: 'trueDensity', label: 'True density after firing', unit: 'kg/m³', read: (e) => e.rho_true_after_firing_kgm3 },
  { key: 'meltingPoint', label: 'Melting point', unit: '°C', read: (e) => e.meltingPoint_C },
  { key: 'chemicalShrinkage', label: 'Chemical shrinkage', unit: 'vol. fraction', read: (e) => e.chemicalShrinkage_volFrac },
  { key: 'activationEnergy', label: 'Activation energy', unit: 'J/mol', read: (e) => e.activationEnergy_Jmol },
  { key: 'crushingStrength', label: 'Crushing strength', unit: 'MPa', read: (e) => e.mechanicalProperties?.crushingStrength_MPa },
  { key: 'modulusOfRupture', label: 'Modulus of rupture', unit: 'MPa', read: (e) => e.mechanicalProperties?.modulusOfRupture_MPa },
  { key: 'youngModulus', label: "Young's modulus", unit: 'GPa', read: (e) => e.mechanicalProperties?.youngModulus_GPa },
  { key: 'hardness', label: 'Hardness', unit: 'HV', read: (e) => e.mechanicalProperties?.hardness_HV },
];
