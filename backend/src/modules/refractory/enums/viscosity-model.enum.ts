/**
 * Glass system types for composition-dependent viscosity models
 */
export enum ViscosityModel {
  SODA_LIME_SILICA = 'SODA_LIME_SILICA',
  BOROSILICATE = 'BOROSILICATE',
  ALUMINOSILICATE = 'ALUMINOSILICATE',
  LEAD_GLASS = 'LEAD_GLASS',
  PURE_SILICA = 'PURE_SILICA',
  SODIUM_SILICATE = 'SODIUM_SILICATE',
  SLAG_CAO_AL2O3 = 'SLAG_CAO_AL2O3',
  FLUORIDE_GLASS = 'FLUORIDE_GLASS',
  MULTI_COMPONENT_MIXING = 'MULTI_COMPONENT_MIXING',
}

export const ViscosityModelNames: Record<ViscosityModel, string> = {
  [ViscosityModel.SODA_LIME_SILICA]: 'Soda-Lime-Silica Glass (Lakatos 1972)',
  [ViscosityModel.BOROSILICATE]: 'Borosilicate Glass (Dingwell 1992)',
  [ViscosityModel.ALUMINOSILICATE]: 'Aluminosilicate Glass (Giordano 2008)',
  [ViscosityModel.LEAD_GLASS]: 'Lead Glass (Mazurin 1983)',
  [ViscosityModel.PURE_SILICA]: 'Pure Fused Silica (Urbain 1982)',
  [ViscosityModel.SODIUM_SILICATE]: 'Sodium Silicate (Bockris 1955)',
  [ViscosityModel.SLAG_CAO_AL2O3]: 'Calcium-Aluminate Slag (Mills 1993)',
  [ViscosityModel.FLUORIDE_GLASS]: 'Fluoride Glass (Poulain 1977)',
  [ViscosityModel.MULTI_COMPONENT_MIXING]: 'Multi-Component Mixing Model',
};

export enum ViscosityModelType {
  ARRHENIUS = 'ARRHENIUS',
  VFT = 'VFT',
}

export enum ConfidenceLevel {
  HIGH = 'HIGH',           // Within validated ranges, established system
  MEDIUM = 'MEDIUM',       // Minor deviations or near boundaries
  LOW = 'LOW',             // Significant deviations or specialty system
  VERY_LOW = 'VERY_LOW',   // Multi-component mixing, major extrapolation
}

export enum ExtrapolationRisk {
  NONE = 'NONE',           // All components within validated ranges
  MINOR = 'MINOR',         // Small deviations (<10%)
  MODERATE = 'MODERATE',   // Moderate deviations (10-25%)
  SEVERE = 'SEVERE',       // Large deviations (>25%) or unknown system
}

