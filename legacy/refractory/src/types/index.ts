/**
 * Core interfaces and types for the Refractory Calculator
 * @module types
 */

/**
 * Oxide composition mapping
 */
export interface OxideComposition {
  Al2O3?: number;
  SiO2?: number;
  CaO?: number;
  Fe2O3?: number;
  MgO?: number;
  TiO2?: number;
  Na2O?: number;
  K2O?: number;
  P2O5?: number;
  [key: string]: number | undefined;
}

/**
 * Particle size fraction
 */
export interface ParticleSizeFraction {
  lowerSize: number;  // mm
  upperSize: number;  // mm
  amount: number;     // percentage
}

/**
 * Component specification
 */
export interface IComponent {
  name: string;
  description?: string;
  composition: OxideComposition;
  fractions: ParticleSizeFraction[];
  amount?: number;  // Weight percentage in mixture
}

/**
 * Phase composition result
 */
export interface PhaseComposition {
  percent: number;
  mass: number;
  composition: OxideComposition;
}

/**
 * Liquid phase with additional properties
 */
export interface LiquidPhase extends PhaseComposition {
  viscosity?: number;  // Pa·s
  temperature: number; // °C
}

/**
 * Glass viscosity fixed points (ASTM C965)
 * Note: ASTM defines in poise. Conversion: 1 Pa·s = 10 poise
 */
export interface GlassViscosityPoints {
  melting: number;      // 10 poise = 1 Pa·s (melting point - liquid homogenization)
  flow: number;         // 10⁵ poise = 10⁴ Pa·s (flow point - upper working limit)
  working: number;      // 10⁴ poise = 10³ Pa·s (working temperature)
  softening: number;    // 10^7.6 poise = 10^6.6 Pa·s (Littleton softening point)
  annealing: number;    // 10¹³ poise = 10¹² Pa·s (annealing point)
  strain: number;       // 10^14.5 poise = 10^13.5 Pa·s (strain point)
  glassTransitionLow: number;   // Lower bound of glass transition (~strain point)
  glassTransitionHigh: number;  // Upper bound of glass transition (~annealing point)
}

/**
 * Mineral phase in solid
 */
export interface MineralPhase {
  phase: string;          // "mullite", "corundum", "quartz", etc.
  formula: string;        // "3Al₂O₃·2SiO₂"
  percent: number;        // weight %
  meltingPoint: number;   // °C (or 0 for amorphous)
  description?: string;
  viscosityPoints?: GlassViscosityPoints;  // For amorphous/glass phases
}

/**
 * Solid phase
 */
export interface SolidPhase extends PhaseComposition {
  unreactedFraction?: number;
  mineralogy?: MineralPhase[];  // Mineral phases present
}

/**
 * Thermal performance metrics
 */
export interface ThermalPerformance {
  refractoriness: number;              // °C - Softening temperature
  deformationTemperature_0_2MPa: number; // °C - RUL at 0.2 MPa
}

/**
 * Calculation diagnostics
 */
export interface Diagnostics {
  massBalanceError: number;
  warnings: string[];
  assumptions: string[];
}

/**
 * Refractoriness point with model information
 */
export interface RefractorinessPoint {
  criterion: string;
  temperature: number;
  modelUsed: string;
  confidence: string;
  notes?: string;
}

/**
 * Multi-model refractoriness evaluation
 */
export interface RefractorinessEvaluation {
  points: RefractorinessPoint[];
  enISO1893: {
    T05: number;   // 0.5% deformation
    T1: number;    // 1% deformation
    T2: number;    // 2% deformation
  };
  astmPCE: number;       // Pyrometric Cone Equivalent
  gostCone: number;      // GOST 4069-69 cone temperature
  modelsSummary: Record<string, string>;
}

/**
 * Final calculation result
 */
export interface CalculationResult {
  liquid: LiquidPhase;
  solid: SolidPhase;
  thermalPerformance: ThermalPerformance;
  refractorinessEvaluation?: RefractorinessEvaluation;  // Multi-model predictions
  diagnostics: Diagnostics;
}

/**
 * Calculation settings
 */
export interface CalculationSettings {
  temperature: number;  // °C
  customConfig?: Partial<RefractoryConfig>;
}

/**
 * Configuration for refractory calculations
 */
export interface RefractoryConfig {
  sizeClassThresholds: {
    fineMax: number;
    mediumMax: number;
    coarseMin: number;
  };
  participation: {
    T50_fine: number;
    T50_medium: number;
    T50_coarse: number;
    k_steepness: number;
    coarseDampingSize: number;
    coarseDampingRate: number;
  };
  liquidFormation: {
    anorthiteRatio: number;
    gehleniteRatio: number;
  };
  viscosity: {
    A_base: number;
    B_base: number;
    Al2O3_effect: number;
    SiO2_effect: number;
    CaO_effect: number;
    Fe2O3_effect: number;
    minViscosity: number;
    maxViscosity: number;
  };
  refractoriness: {
    T_base_softening: number;
    T_base_RUL: number;
    Al2O3Sensitivity: number;
    liquidSensitivity: number;
    fluxSensitivity: number;
    liquidThresholdForRUL: number;
    minRefractoriness: number;
    maxRefractoriness: number;
  };
  tolerances: {
    massBalanceErrorMax: number;
    compositionSumTolerance: number;
  };
  rounding: {
    percentDecimals: number;
    compositionDecimals: number;
    temperatureDecimals: number;
    viscositySignificantFigures: number;
  };
  minTemperature: number;
  maxTemperature: number;
}

/**
 * Eutectic point data
 */
export interface EutecticPoint {
  temperature: number;
  composition: OxideComposition;
  phases: string[];
  description?: string;
}

/**
 * Phase diagram system
 */
export interface PhaseDiagramSystem {
  description: string;
  eutectics: Record<string, EutecticPoint>;
}

/**
 * Size classification
 */
export enum SizeClass {
  ULTRA_FINE = 'ultra_fine',
  VERY_FINE = 'very_fine',
  FINE = 'fine',
  MEDIUM_FINE = 'medium_fine',
  MEDIUM = 'medium',
  COARSE = 'coarse',
  VERY_COARSE = 'very_coarse'
}

/**
 * Sieve standard types
 */
export enum SieveStandard {
  ASTM_E11 = 'ASTM_E11',
  ISO_3310_1 = 'ISO_3310_1',
  TYLER = 'Tyler',
  FEPA_F = 'FEPA_F',
  FEPA_P = 'FEPA_P'
}

