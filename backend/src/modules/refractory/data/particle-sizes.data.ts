/**
 * Standard Particle Size Fractions
 *
 * Defines standard particle size ranges for aggregates in refractory materials.
 * These can be referenced by any aggregate material via availableParticleSizes field.
 *
 * References:
 * - ASTM C92: Standard Test Methods for Sieve Analysis and Water Content of Refractory Materials
 * - ISO 8656-1: Refractory products - Sampling and acceptance testing
 */

export interface ParticleSizeRange {
  dMin_mm: number;
  dMax_mm: number;
  d50_mm: number;
  grade: string;
  description?: string; // User-friendly description (used for classifications)
}

// ...existing code...

/**
 * Particle Size Classifications
 * User-friendly size selection based on mesh sizes and common practice
 * Uses ParticleSizeRange interface with classification-specific fields
 *
 * References:
 * - ASTM E11: Standard Specification for Woven Wire Test Sieve Cloth and Test Sieves
 */
export const PARTICLE_SIZE_CLASSIFICATIONS: Record<string, ParticleSizeRange & { mesh: string; name: string }> = {
  extra_coarse: {
    dMin_mm: 4.75,
    dMax_mm: 10.0,
    d50_mm: 7.375,
    grade: 'Extra Coarse',
    description: 'Extra Coarse - >4 mesh (>4.75 mm)',
    mesh: '> 4 mesh',
    name: 'Extra Coarse',
  },
  coarse: {
    dMin_mm: 2.36,
    dMax_mm: 4.75,
    d50_mm: 3.555,
    grade: 'Coarse',
    description: 'Coarse - 4-6 mesh (2.36-4.75 mm)',
    mesh: '4-6 mesh',
    name: 'Coarse',
  },
  medium: {
    dMin_mm: 0.6,
    dMax_mm: 2.36,
    d50_mm: 1.48,
    grade: 'Medium',
    description: 'Medium - 6-30 mesh (0.6-2.36 mm)',
    mesh: '6-30 mesh',
    name: 'Medium',
  },
  fine: {
    dMin_mm: 0.125,
    dMax_mm: 0.6,
    d50_mm: 0.3625,
    grade: 'Fine',
    description: 'Fine - 30-120 mesh (0.125-0.6 mm)',
    mesh: '30-120 mesh',
    name: 'Fine',
  },
  very_fine: {
    dMin_mm: 0.038,
    dMax_mm: 0.125,
    d50_mm: 0.0815,
    grade: 'Very Fine',
    description: 'Very Fine - 120-400 mesh (0.038-0.125 mm)',
    mesh: '120-400 mesh',
    name: 'Very Fine',
  },
  ultra_fine: {
    dMin_mm: 0.001,
    dMax_mm: 0.038,
    d50_mm: 0.0195,
    grade: 'Ultra Fine',
    description: 'Ultra Fine - <400 mesh (<0.038 mm)',
    mesh: '< 400 mesh',
    name: 'Ultra Fine',
  },
};

export const STANDARD_PARTICLE_SIZES: Record<string, ParticleSizeRange> = {
  // Coarse fractions (> 3mm)
  COARSE_10_6: { dMin_mm: 6.0, dMax_mm: 10.0, d50_mm: 8.0, grade: 'Coarse 6-10mm' },
  COARSE_6_3: { dMin_mm: 3.0, dMax_mm: 6.0, d50_mm: 4.5, grade: 'Coarse 3-6mm' },

  // Medium fractions (0.5-3mm)
  MEDIUM_3_1: { dMin_mm: 1.0, dMax_mm: 3.0, d50_mm: 2.0, grade: 'Medium 1-3mm' },
  MEDIUM_1_05: { dMin_mm: 0.5, dMax_mm: 1.0, d50_mm: 0.75, grade: 'Medium 0.5-1mm' },
  MEDIUM_05_02: { dMin_mm: 0.2, dMax_mm: 0.5, d50_mm: 0.35, grade: 'Medium 0.2-0.5mm' },

  // Fine fractions (0.037-0.5mm)
  FINE_1_01: { dMin_mm: 0.1, dMax_mm: 1.0, d50_mm: 0.55, grade: 'Fine 0.1-1mm' },
  FINE_05_01: { dMin_mm: 0.1, dMax_mm: 0.5, d50_mm: 0.3, grade: 'Fine 0.1-0.5mm' },
  FINE_03_01: { dMin_mm: 0.1, dMax_mm: 0.3, d50_mm: 0.2, grade: 'Fine 0.1-0.3mm' },
  FINE_06_004: { dMin_mm: 0.037, dMax_mm: 0.6, d50_mm: 0.3, grade: 'Fine 0.037-0.6mm' },

  // Powder fractions (0.01-0.15mm)
  POWDER_015_005: { dMin_mm: 0.05, dMax_mm: 0.15, d50_mm: 0.1, grade: 'Powder 0.05-0.15mm' },
  POWDER_05_001: { dMin_mm: 0.01, dMax_mm: 0.05, d50_mm: 0.025, grade: 'Powder 0.01-0.05mm' },

  // Ultrafine (< 0.01mm)
  ULTRAFINE: { dMin_mm: 0.001, dMax_mm: 0.01, d50_mm: 0.005, grade: 'Ultrafine <0.01mm' },

  // Mixed/Polyfractional
  MIXED_6_004: { dMin_mm: 0.037, dMax_mm: 6.0, d50_mm: 1.0, grade: 'Mixed 0.037-6mm' },
  MIXED_3_004: { dMin_mm: 0.037, dMax_mm: 3.0, d50_mm: 0.5, grade: 'Mixed 0.037-3mm' },
};

/**
 * Cement Particle Size Distributions
 *
 * Specific for binders/cements - these have characteristic particle size distributions
 * different from aggregates. Typically measured by Blaine fineness or laser diffraction.
 */
export const CEMENT_PARTICLE_SIZES: Record<string, ParticleSizeRange> = {
  // Standard cement fineness
  CEMENT_STANDARD: { dMin_mm: 0.001, dMax_mm: 0.1, d50_mm: 0.015, grade: 'Standard cement' },
  CEMENT_FINE: { dMin_mm: 0.001, dMax_mm: 0.08, d50_mm: 0.012, grade: 'Fine cement' },
  CEMENT_ULTRAFINE: { dMin_mm: 0.0005, dMax_mm: 0.05, d50_mm: 0.008, grade: 'Ultrafine cement' },

  // Specific CAC grades
  CAC_70_STANDARD: { dMin_mm: 0.001, dMax_mm: 0.1, d50_mm: 0.015, grade: 'CA-70 standard' },
  CAC_80_FINE: { dMin_mm: 0.001, dMax_mm: 0.1, d50_mm: 0.012, grade: 'CA-80 fine' },
  FONDU_ULTRAFINE: { dMin_mm: 0.0005, dMax_mm: 0.08, d50_mm: 0.010, grade: 'Fondu ultrafine' },
};

/**
 * ASTM Mesh-Based Particle Sizes
 *
 * Standard mesh ranges commonly used in refractory industry.
 * Based on ASTM E11 standard test sieve sizes.
 */
export const MESH_PARTICLE_SIZES: Record<string, ParticleSizeRange> = {
  // Coarse ranges
  MESH_OVER_30: { dMin_mm: 0.6, dMax_mm: 10.0, d50_mm: 2.0, grade: '>30 mesh (>0.6mm)' },
  MESH_UNDER_30: { dMin_mm: 0.001, dMax_mm: 0.6, d50_mm: 0.2, grade: '<30 mesh (<0.6mm)' },

  // Medium ranges
  MESH_30_120: { dMin_mm: 0.125, dMax_mm: 0.6, d50_mm: 0.35, grade: '30-120 mesh (0.125-0.6mm)' },
  MESH_UNDER_120: { dMin_mm: 0.001, dMax_mm: 0.125, d50_mm: 0.05, grade: '<120 mesh (<0.125mm)' },

  // Fine ranges
  MESH_120_400: { dMin_mm: 0.038, dMax_mm: 0.125, d50_mm: 0.08, grade: '120-400 mesh (0.038-0.125mm)' },
  MESH_UNDER_400: { dMin_mm: 0.001, dMax_mm: 0.038, d50_mm: 0.015, grade: '<400 mesh (<0.038mm)' },

  // Exact mesh sizes (for single sieve fraction)
  MESH_4: { dMin_mm: 4.0, dMax_mm: 6.0, d50_mm: 4.75, grade: '4 mesh (4.75mm)' },
  MESH_6: { dMin_mm: 2.8, dMax_mm: 4.0, d50_mm: 3.35, grade: '6 mesh (3.35mm)' },
  MESH_8: { dMin_mm: 2.0, dMax_mm: 2.8, d50_mm: 2.36, grade: '8 mesh (2.36mm)' },
  MESH_10: { dMin_mm: 1.7, dMax_mm: 2.3, d50_mm: 2.0, grade: '10 mesh (2.0mm)' },
  MESH_12: { dMin_mm: 1.4, dMax_mm: 2.0, d50_mm: 1.7, grade: '12 mesh (1.7mm)' },
  MESH_16: { dMin_mm: 1.0, dMax_mm: 1.4, d50_mm: 1.18, grade: '16 mesh (1.18mm)' },
  MESH_20: { dMin_mm: 0.7, dMax_mm: 1.0, d50_mm: 0.85, grade: '20 mesh (0.85mm)' },
  MESH_30: { dMin_mm: 0.5, dMax_mm: 0.7, d50_mm: 0.6, grade: '30 mesh (0.6mm)' },
  MESH_40: { dMin_mm: 0.36, dMax_mm: 0.5, d50_mm: 0.425, grade: '40 mesh (0.425mm)' },
  MESH_50: { dMin_mm: 0.25, dMax_mm: 0.36, d50_mm: 0.3, grade: '50 mesh (0.3mm)' },
  MESH_60: { dMin_mm: 0.212, dMax_mm: 0.3, d50_mm: 0.25, grade: '60 mesh (0.25mm)' },
  MESH_70: { dMin_mm: 0.18, dMax_mm: 0.25, d50_mm: 0.212, grade: '70 mesh (0.212mm)' },
  MESH_80: { dMin_mm: 0.15, dMax_mm: 0.212, d50_mm: 0.18, grade: '80 mesh (0.18mm)' },
  MESH_100: { dMin_mm: 0.125, dMax_mm: 0.18, d50_mm: 0.15, grade: '100 mesh (0.15mm)' },
  MESH_120: { dMin_mm: 0.106, dMax_mm: 0.15, d50_mm: 0.125, grade: '120 mesh (0.125mm)' },
  MESH_140: { dMin_mm: 0.09, dMax_mm: 0.125, d50_mm: 0.106, grade: '140 mesh (0.106mm)' },
  MESH_170: { dMin_mm: 0.075, dMax_mm: 0.106, d50_mm: 0.09, grade: '170 mesh (0.09mm)' },
  MESH_200: { dMin_mm: 0.063, dMax_mm: 0.09, d50_mm: 0.075, grade: '200 mesh (0.075mm)' },
  MESH_230: { dMin_mm: 0.053, dMax_mm: 0.075, d50_mm: 0.063, grade: '230 mesh (0.063mm)' },
  MESH_270: { dMin_mm: 0.045, dMax_mm: 0.063, d50_mm: 0.053, grade: '270 mesh (0.053mm)' },
  MESH_325: { dMin_mm: 0.038, dMax_mm: 0.053, d50_mm: 0.045, grade: '325 mesh (0.045mm)' },
  MESH_400: { dMin_mm: 0.032, dMax_mm: 0.045, d50_mm: 0.038, grade: '400 mesh (0.038mm)' },
  MESH_450: { dMin_mm: 0.025, dMax_mm: 0.038, d50_mm: 0.032, grade: '450 mesh (0.032mm)' },
  MESH_500: { dMin_mm: 0.020, dMax_mm: 0.032, d50_mm: 0.025, grade: '500 mesh (0.025mm)' },
};

/**
 * FEPA F Series (Macrogrits)
 *
 * Federation of European Producers of Abrasives - F series for bonded abrasives.
 * Commonly used for silicon carbide, alumina abrasives, and technical ceramics.
 */
export const FEPA_F_SIZES: Record<string, ParticleSizeRange> = {
  F4: { dMin_mm: 4.1, dMax_mm: 5.8, d50_mm: 4.890, grade: 'F4 (4.89mm)' },
  F6: { dMin_mm: 2.9, dMax_mm: 4.1, d50_mm: 3.460, grade: 'F6 (3.46mm)' },
  F8: { dMin_mm: 2.1, dMax_mm: 2.9, d50_mm: 2.460, grade: 'F8 (2.46mm)' },
  F10: { dMin_mm: 1.75, dMax_mm: 2.5, d50_mm: 2.085, grade: 'F10 (2.085mm)' },
  F12: { dMin_mm: 1.47, dMax_mm: 2.1, d50_mm: 1.765, grade: 'F12 (1.765mm)' },
  F14: { dMin_mm: 1.23, dMax_mm: 1.75, d50_mm: 1.470, grade: 'F14 (1.47mm)' },
  F16: { dMin_mm: 1.04, dMax_mm: 1.47, d50_mm: 1.230, grade: 'F16 (1.23mm)' },
  F20: { dMin_mm: 0.885, dMax_mm: 1.23, d50_mm: 1.040, grade: 'F20 (1.04mm)' },
  F22: { dMin_mm: 0.745, dMax_mm: 1.04, d50_mm: 0.885, grade: 'F22 (0.885mm)' },
  F24: { dMin_mm: 0.625, dMax_mm: 0.885, d50_mm: 0.745, grade: 'F24 (0.745mm)' },
  F30: { dMin_mm: 0.525, dMax_mm: 0.745, d50_mm: 0.625, grade: 'F30 (0.625mm)' },
  F36: { dMin_mm: 0.438, dMax_mm: 0.625, d50_mm: 0.525, grade: 'F36 (0.525mm)' },
  F40: { dMin_mm: 0.370, dMax_mm: 0.525, d50_mm: 0.438, grade: 'F40 (0.438mm)' },
  F46: { dMin_mm: 0.310, dMax_mm: 0.438, d50_mm: 0.370, grade: 'F46 (0.37mm)' },
  F54: { dMin_mm: 0.260, dMax_mm: 0.370, d50_mm: 0.310, grade: 'F54 (0.31mm)' },
  F60: { dMin_mm: 0.218, dMax_mm: 0.310, d50_mm: 0.260, grade: 'F60 (0.26mm)' },
  F70: { dMin_mm: 0.185, dMax_mm: 0.260, d50_mm: 0.218, grade: 'F70 (0.218mm)' },
  F80: { dMin_mm: 0.154, dMax_mm: 0.218, d50_mm: 0.185, grade: 'F80 (0.185mm)' },
  F90: { dMin_mm: 0.129, dMax_mm: 0.185, d50_mm: 0.154, grade: 'F90 (0.154mm)' },
  F100: { dMin_mm: 0.109, dMax_mm: 0.154, d50_mm: 0.129, grade: 'F100 (0.129mm)' },
  F120: { dMin_mm: 0.082, dMax_mm: 0.129, d50_mm: 0.109, grade: 'F120 (0.109mm)' },
  F150: { dMin_mm: 0.069, dMax_mm: 0.109, d50_mm: 0.082, grade: 'F150 (0.082mm)' },
  F180: { dMin_mm: 0.058, dMax_mm: 0.082, d50_mm: 0.069, grade: 'F180 (0.069mm)' },
  F200: { dMin_mm: 0.053, dMax_mm: 0.069, d50_mm: 0.058, grade: 'F200 (0.058mm)' },
  F220: { dMin_mm: 0.045, dMax_mm: 0.058, d50_mm: 0.053, grade: 'F220 (0.053mm)' },
};

/**
 * FEPA P Series (Coated Abrasives)
 *
 * FEPA P series for coated abrasives (sandpaper).
 * Also used for silicon carbide and other technical ceramics.
 */
export const FEPA_P_SIZES: Record<string, ParticleSizeRange> = {
  P12: { dMin_mm: 1.5, dMax_mm: 2.2, d50_mm: 1.815, grade: 'P12 (1.815mm)' },
  P16: { dMin_mm: 1.1, dMax_mm: 1.6, d50_mm: 1.324, grade: 'P16 (1.324mm)' },
  P20: { dMin_mm: 0.85, dMax_mm: 1.2, d50_mm: 1.000, grade: 'P20 (1.0mm)' },
  P24: { dMin_mm: 0.65, dMax_mm: 0.9, d50_mm: 0.764, grade: 'P24 (0.764mm)' },
  P30: { dMin_mm: 0.54, dMax_mm: 0.75, d50_mm: 0.642, grade: 'P30 (0.642mm)' },
  P36: { dMin_mm: 0.45, dMax_mm: 0.63, d50_mm: 0.538, grade: 'P36 (0.538mm)' },
  P40: { dMin_mm: 0.36, dMax_mm: 0.5, d50_mm: 0.425, grade: 'P40 (0.425mm)' },
  P50: { dMin_mm: 0.28, dMax_mm: 0.4, d50_mm: 0.336, grade: 'P50 (0.336mm)' },
  P60: { dMin_mm: 0.23, dMax_mm: 0.32, d50_mm: 0.269, grade: 'P60 (0.269mm)' },
  P80: { dMin_mm: 0.17, dMax_mm: 0.24, d50_mm: 0.201, grade: 'P80 (0.201mm)' },
  P100: { dMin_mm: 0.14, dMax_mm: 0.19, d50_mm: 0.162, grade: 'P100 (0.162mm)' },
  P120: { dMin_mm: 0.11, dMax_mm: 0.15, d50_mm: 0.125, grade: 'P120 (0.125mm)' },
  P150: { dMin_mm: 0.085, dMax_mm: 0.12, d50_mm: 0.100, grade: 'P150 (0.1mm)' },
  P180: { dMin_mm: 0.070, dMax_mm: 0.10, d50_mm: 0.082, grade: 'P180 (0.082mm)' },
  P220: { dMin_mm: 0.058, dMax_mm: 0.082, d50_mm: 0.068, grade: 'P220 (0.068mm)' },
  P240: { dMin_mm: 0.050, dMax_mm: 0.070, d50_mm: 0.0585, grade: 'P240 (0.0585mm)' },
  P280: { dMin_mm: 0.045, dMax_mm: 0.062, d50_mm: 0.0522, grade: 'P280 (0.0522mm)' },
  P320: { dMin_mm: 0.040, dMax_mm: 0.055, d50_mm: 0.0463, grade: 'P320 (0.0463mm)' },
  P360: { dMin_mm: 0.035, dMax_mm: 0.048, d50_mm: 0.0403, grade: 'P360 (0.0403mm)' },
  P400: { dMin_mm: 0.030, dMax_mm: 0.042, d50_mm: 0.0353, grade: 'P400 (0.0353mm)' },
  P500: { dMin_mm: 0.026, dMax_mm: 0.036, d50_mm: 0.0304, grade: 'P500 (0.0304mm)' },
  P600: { dMin_mm: 0.022, dMax_mm: 0.031, d50_mm: 0.0260, grade: 'P600 (0.026mm)' },
};

