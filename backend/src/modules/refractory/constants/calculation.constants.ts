/**
 * Shared constants for refractory calculations (physics, limits, duty classes).
 * One grouped export per docs/CONVENTIONS.md § Choosing the form.
 */
import { PHYSICAL_CONSTANTS } from '../../../common/thermal/constants/physical.constants';

/**
 * Universal refractory calculation constants.
 * Sources: ISO 1893:2015 (RUL load), NIST (air λ), Kingery et al. (1976) (λ(T) coeff).
 */
export const CALCULATION_CONSTANTS = {
  /** Gas constant re-export for documentation grouping [J/(mol·K)] */
  GAS_CONSTANT_J_MOLK: PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK,

  /** Standard RUL test load [Pa] — EN ISO 1893:2015 */
  RUL_TEST_LOAD_PA: 0.2e6,

  /** Default porosity when unspecified [fraction 0–1] */
  DEFAULT_POROSITY: 0.2,

  /** Air thermal conductivity at ~20 °C [W/(m·K)] — NIST */
  AIR_THERMAL_CONDUCTIVITY: 0.025,

  /** Base reference temperature [°C] */
  BASE_TEMPERATURE_C: 20,

  /** Base refractoriness reference [°C] */
  BASE_REFRACTORINESS_C: 1400,

  /** Base density reference for porous-material calculations [kg/m³] */
  BASE_DENSITY_KGM3: 2500,

  /** Thermal conductivity temperature coefficient [K⁻¹] — Kingery et al. (1976) */
  THERMAL_CONDUCTIVITY_TEMP_COEFF: -0.0003,

  /** Specific-heat temperature coefficient [J/(kg·K²)] */
  SPECIFIC_HEAT_TEMP_COEFF: 0.3,

  /** Base specific heat at 20 °C [J/(kg·K)] */
  BASE_SPECIFIC_HEAT_JKGK: 800,

  /** Minimum temperature for calculations [°C] */
  MIN_TEMPERATURE_C: 800,

  /** Maximum temperature for calculations [°C] */
  MAX_TEMPERATURE_C: 2500,

  /** Minimum porosity [fraction] */
  MIN_POROSITY: 0.0,

  /** Maximum practical porosity for refractories [fraction] */
  MAX_POROSITY: 0.5,

  /** Minimum density threshold (insulating below) [kg/m³] */
  MIN_DENSITY_KGM3: 1000,

  /** Maximum density threshold (fully dense above) [kg/m³] */
  MAX_DENSITY_KGM3: 4000,

  /** Arrhenius viscosity pre-factor A [Pa·s] */
  VISCOSITY_A_BASE: 0.001,

  /** Arrhenius viscosity activation parameter B [K] */
  VISCOSITY_B_BASE: 10000,

  /** Minimum viscosity clamp [Pa·s] */
  MIN_VISCOSITY_PAS: 0.001,

  /** Maximum viscosity clamp [Pa·s] */
  MAX_VISCOSITY_PAS: 1e10,

  /** Low-duty refractoriness upper limit [°C] */
  LOW_DUTY_LIMIT_C: 1580,

  /** Intermediate-duty refractoriness upper limit [°C] */
  INTERMEDIATE_DUTY_LIMIT_C: 1750,

  /** High-duty refractoriness upper limit [°C] */
  HIGH_DUTY_LIMIT_C: 1850,

  /** Minimum pyrometric cone number — ASTM E794 */
  MIN_CONE_NUMBER: 10,

  /** Maximum pyrometric cone number — ASTM E794 */
  MAX_CONE_NUMBER: 40,
} as const;
