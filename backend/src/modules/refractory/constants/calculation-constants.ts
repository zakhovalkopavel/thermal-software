/**
 * Shared Constants for Refractory Calculations
 *
 * This file contains universal constants used across multiple services
 * to ensure consistency and avoid duplication.
 *
 * Date: February 2, 2026
 * Last Updated: February 2, 2026
 */

// ============================================================
// UNIVERSAL CONSTANTS (Physics & Chemistry)
// ============================================================

/**
 * Universal Gas Constant
 * Used in thermodynamic calculations for:
 * - Viscosity calculations (Arrhenius equation)
 * - Thermal property calculations
 * - Refractoriness estimations
 * - Shrinkage predictions
 *
 * References:
 * - CODATA 2018 recommended value
 * - Units: J/(mol·K)
 */
export const GAS_CONSTANT = 8.314;

/**
 * Absolute Zero Temperature (Kelvin to Celsius conversion)
 * Used in temperature conversions
 *
 * Reference: Standard temperature scale definition
 */
export const ABSOLUTE_ZERO_OFFSET = 273.15;

// ============================================================
// TESTING & MEASUREMENT CONSTANTS
// ============================================================

/**
 * Standard Test Load for RUL (Refractoriness Under Load)
 * Used in refractoriness calculations per ISO 1893:2015
 *
 * Units: Pa (Pascals)
 * Reference: EN ISO 1893:2015 standard
 */
export const RUL_TEST_LOAD_PA = 0.2e6; // 0.2 MPa

/**
 * Standard Porosity for Reference Material
 * Default porosity assumption when not specified
 *
 * Units: Fraction (0-1)
 * Default: 0.2 (20%)
 */
export const DEFAULT_POROSITY = 0.2;

/**
 * Air Thermal Conductivity (pore fluid)
 * Used in porosity correction models (Maxwell-Eucken equation)
 *
 * Units: W/(m·K)
 * Temperature: ~20°C, atmospheric pressure
 * Reference: NIST database
 */
export const AIR_THERMAL_CONDUCTIVITY = 0.025;

// ============================================================
// BASE TEMPERATURE REFERENCES
// ============================================================

/**
 * Base Reference Temperature for Calculations
 * Standard room temperature for material properties
 *
 * Units: °C
 * Reference: ISO standard conditions
 */
export const BASE_TEMPERATURE_C = 20;

/**
 * Base Refractoriness Temperature
 * Used as reference in refractoriness estimations
 *
 * Units: °C
 * Reference: Industry standard for refractory calculations
 */
export const BASE_REFRACTORINESS_C = 1400;

/**
 * Base Density Reference
 * Standard density reference for porous material calculations
 *
 * Units: kg/m³
 * Reference: Typical refractory material density
 */
export const BASE_DENSITY_KGM3 = 2500;

// ============================================================
// THERMAL PROPERTY COEFFICIENTS
// ============================================================

/**
 * Temperature Coefficient for Thermal Conductivity
 * Models how thermal conductivity changes with temperature
 * k(T) = k_base × (1 + α × ΔT)
 *
 * Units: K⁻¹
 * Typical for ceramic materials: -0.0003 to -0.0005
 * Reference: Kingery et al. (1976) - Introduction to Ceramics
 */
export const THERMAL_CONDUCTIVITY_TEMP_COEFF = -0.0003;

/**
 * Temperature Coefficient for Specific Heat
 * Models how specific heat increases with temperature
 * Cp(T) = Cp_base + α × T
 *
 * Units: J/(kg·K²)
 * Typical for refractory materials: 0.2-0.5
 * Reference: Standard refractory property data
 */
export const SPECIFIC_HEAT_TEMP_COEFF = 0.3;

/**
 * Base Specific Heat Capacity
 * Reference specific heat at 20°C
 *
 * Units: J/(kg·K)
 * Typical for refractory materials
 */
export const BASE_SPECIFIC_HEAT_JKGK = 800;

// ============================================================
// TEMPERATURE RANGE LIMITS
// ============================================================

/**
 * Minimum Temperature Limit for Calculations
 * Clamps calculations to physically meaningful values
 *
 * Units: °C
 */
export const MIN_TEMPERATURE_C = 800;

/**
 * Maximum Temperature Limit for Calculations
 * Clamps calculations to physically meaningful values
 *
 * Units: °C
 */
export const MAX_TEMPERATURE_C = 2500;

// ============================================================
// COMPOSITION LIMITS
// ============================================================

/**
 * Minimum Porosity for Calculations
 * Physical limit - 0% porosity (fully dense)
 *
 * Units: Fraction (0-1)
 */
export const MIN_POROSITY = 0.0;

/**
 * Maximum Porosity for Calculations
 * Practical limit for refractory materials
 *
 * Units: Fraction (0-1)
 * Reference: Typical porosity range for refractories (0-50%)
 */
export const MAX_POROSITY = 0.5;

/**
 * Minimum Density Threshold
 * Below this density, material is considered insulating
 *
 * Units: kg/m³
 */
export const MIN_DENSITY_KGM3 = 1000;

/**
 * Maximum Density Threshold
 * Above this, assumes fully dense material
 *
 * Units: kg/m³
 */
export const MAX_DENSITY_KGM3 = 4000;

// ============================================================
// VISCOSITY CONSTANTS
// ============================================================

/**
 * Base Pre-exponential Factor (Arrhenius Model)
 * Used in viscosity calculations: η = A × exp(B/T)
 *
 * Units: Pa·s
 */
export const VISCOSITY_A_BASE = 0.001;

/**
 * Base Activation Energy Parameter (Arrhenius Model)
 * Used in viscosity calculations: η = A × exp(B/T)
 *
 * Units: K
 */
export const VISCOSITY_B_BASE = 10000;

/**
 * Minimum Viscosity Threshold
 * Physical lower limit to prevent numerical issues
 *
 * Units: Pa·s
 */
export const MIN_VISCOSITY_PAS = 0.001;

/**
 * Maximum Viscosity Threshold
 * Physical upper limit to prevent numerical issues
 *
 * Units: Pa·s
 */
export const MAX_VISCOSITY_PAS = 1e10;

// ============================================================
// REFRACTORINESS DUTY CLASSIFICATION
// ============================================================

/**
 * Low Duty Refractoriness Upper Limit
 * Temperature threshold: < 1580°C
 *
 * Units: °C
 */
export const LOW_DUTY_LIMIT_C = 1580;

/**
 * Intermediate Duty Refractoriness Upper Limit
 * Temperature threshold: 1580-1750°C
 *
 * Units: °C
 */
export const INTERMEDIATE_DUTY_LIMIT_C = 1750;

/**
 * High Duty Refractoriness Upper Limit
 * Temperature threshold: 1750-1850°C
 *
 * Units: °C
 */
export const HIGH_DUTY_LIMIT_C = 1850;

// ============================================================
// PYROMETRIC CONE EQUIVALENTS
// ============================================================

/**
 * Minimum Pyrometric Cone Number
 * ASTM E794 standard
 *
 * Units: Cone number
 */
export const MIN_CONE_NUMBER = 10;

/**
 * Maximum Pyrometric Cone Number
 * ASTM E794 standard
 *
 * Units: Cone number
 */
export const MAX_CONE_NUMBER = 40;

// ============================================================
// EXPORT ALL CONSTANTS AS OBJECT (for documentation)
// ============================================================

/**
 * All constants grouped by category for reference
 */
export const CALCULATION_CONSTANTS = {
  physics: {
    GAS_CONSTANT,
    ABSOLUTE_ZERO_OFFSET,
  },
  testing: {
    RUL_TEST_LOAD_PA,
    DEFAULT_POROSITY,
    AIR_THERMAL_CONDUCTIVITY,
  },
  baseTemperatures: {
    BASE_TEMPERATURE_C,
    BASE_REFRACTORINESS_C,
    BASE_DENSITY_KGM3,
  },
  thermalCoefficients: {
    THERMAL_CONDUCTIVITY_TEMP_COEFF,
    SPECIFIC_HEAT_TEMP_COEFF,
    BASE_SPECIFIC_HEAT_JKGK,
  },
  temperatureLimits: {
    MIN_TEMPERATURE_C,
    MAX_TEMPERATURE_C,
  },
  compositionLimits: {
    MIN_POROSITY,
    MAX_POROSITY,
    MIN_DENSITY_KGM3,
    MAX_DENSITY_KGM3,
  },
  viscosity: {
    VISCOSITY_A_BASE,
    VISCOSITY_B_BASE,
    MIN_VISCOSITY_PAS,
    MAX_VISCOSITY_PAS,
  },
  refractoriness: {
    LOW_DUTY_LIMIT_C,
    INTERMEDIATE_DUTY_LIMIT_C,
    HIGH_DUTY_LIMIT_C,
  },
  cones: {
    MIN_CONE_NUMBER,
    MAX_CONE_NUMBER,
  },
};

