/**
 * Type definitions for Polyfractional Blend Design Module
 * @module blend-types
 *
 * References:
 * - Andreasen, A.A. (1930) - Particle packing theory
 * - Funk & Dinger (1994) - Predictive Process Control
 * - de Larrard, F. (1999) - CPM model
 */

/**
 * Particle size fraction input
 */
export interface FractionInput {
  id: string;
  dMin_mm: number;  // Minimum particle diameter (mm)
  dMax_mm: number;  // Maximum particle diameter (mm)
  materialId: string;  // Reference to material library

  // Fixed fractions feature (v1.1.0)
  isFixed?: boolean;  // If true, this fraction has a fixed amount
  fixedAmount?: number;  // Percentage (0-100) for fixed fractions - not optimized by PSD
}

/**
 * Material properties from library
 */
export interface MaterialEntry {
  materialId: string;
  name: string;
  rho_true_after_firing_kgm3: number;  // True density after firing (kg/m³)
  chemicalShrinkage_volFrac?: number;  // Chemical shrinkage fraction (e.g., 0.01 = 1%)
  activationEnergy_Jmol?: number;  // Sintering activation energy (J/mol)
  typicalGrainSize_um?: number;  // Average grain size (μm)
  meltingPoint_C?: number;  // Melting point (°C)
  sourceUrl?: string;  // Reference documentation
  notes?: string;
}

/**
 * Base composition for optimization
 */
export interface BaseComposition {
  fractionId: string;
  massPercent: number;  // Mass percentage in base
}

/**
 * PSD calculation result
 */
export interface PSDResult {
  method: 'Andreasen' | 'FunkDinger';
  q: number;  // Distribution modulus
  massFractions: number[];  // Raw mass fractions (sum = 1)
  massFractionsRoundedPercent: number[];  // Integer percentages (sum = 100)
  Dmin_mm: number;
  Dmax_mm: number;

  // Fixed fractions tracking (v1.1.0)
  fixedFractionsUsed?: {
    fractionId: string;
    fixedAmount: number;
  }[];
  variableFractionsCount?: number;
  totalFixedPercent?: number;
}

/**
 * Packing model result
 */
export interface PackingResult {
  model: 'CPM' | 'Furnas';
  packingFraction_phi: number;  // Volume fraction of solids (0-1)
  porosity_initial: number;  // Initial porosity (1 - phi)
  effectivePackingDensity?: number;  // Considering compaction
  calibrationParams?: {
    virtualPacking_beta0?: number;
    compactionIndex?: number;
    efficiencyFactor?: number;
  };
  notes?: string;
}

/**
 * Shrinkage prediction result
 */
export interface ShrinkageResult {
  chemicalShrinkage_volFrac: number;  // Volumetric chemical shrinkage
  chemicalShrinkage_linearFrac: number;  // Linear chemical shrinkage
  sinteringShrinkage_volFracByTemp: { [tempC: string]: number };  // By temperature
  sinteringShrinkage_linearFracByTemp: { [tempC: string]: number };
  totalVolumetricShrinkageByTemp: { [tempC: string]: number };
  totalLinearShrinkageByTemp: { [tempC: string]: number };
  model: 'MSC' | 'Diffusion' | 'Combined';
  confidence: 'High' | 'Medium' | 'Low';
}

/**
 * Final blend properties at each processing stage
 */
export interface FinalProperties {
  method: 'Andreasen' | 'FunkDinger';
  q: number;
  scenario: string;  // e.g., "Self-compacting", "Vibrated"

  // Composition
  fractions: FractionInput[];
  massFractions: number[];  // Raw (not rounded)
  massFractionsRoundedPercent: number[];  // Integer, sum = 100

  // Densities (g/ml)
  rhoSkeletal_gml: number;  // True density (2 decimals)
  rhoBulk_gml_green: number;  // After mixing (2 decimals)
  rhoBulk_gml_dried: number;  // After drying (2 decimals)
  rhoBulk_gml_byTemp: { [tempC: string]: number };  // After firing (2 decimals)

  // Porosity (vol %, 0.1% precision)
  porosity_percent_green: number;
  porosity_percent_dried: number;
  porosity_percent_byTemp: { [tempC: string]: number };

  // Water absorption (mass %, 0.1% precision)
  waterAbsorption_percent_dried: number;
  waterAbsorption_percent_byTemp: { [tempC: string]: number };

  // Performance indicators
  flowabilityCategory: 'Self-compacting' | 'Flowable' | 'Vibratable' | 'Hand-pressable';
  packingEfficiency: number;  // 0-1

  // Shrinkage data
  shrinkage?: ShrinkageResult;

  // Base composition difference (if base provided)
  partsToAddPer100Base?: { fractionId: string; parts: number }[];

  // Intermediate results for validation
  intermediate?: {
    packing: PackingResult;
    psd: PSDResult;
  };
}

/**
 * Saved mix preset
 */
export interface SavedMix {
  id: string;
  name: string;
  description?: string;
  createdDate: string;  // ISO date string
  modifiedDate?: string;
  author?: string;

  // Composition
  composition: FractionInput[];

  // Optimization parameters
  optimizationParams: {
    method: 'Andreasen' | 'FunkDinger';
    q: number;
    scenario: string;
    packingModel: 'CPM' | 'Furnas';
  };

  // Calculated properties
  properties: FinalProperties;

  // Metadata
  tags?: string[];
  category?: string;  // e.g., "High-alumina", "Self-compacting", "Experimental"
  version?: number;

  // Total oxide composition (for phase calculations)
  oxideComposition?: {
    Al2O3?: number;
    SiO2?: number;
    CaO?: number;
    Fe2O3?: number;
    MgO?: number;
    [key: string]: number | undefined;
  };
}

/**
 * Optimization options
 */
export interface OptimizationOptions {
  // PSD parameters
  qValues?: number[];  // Distribution moduli to evaluate (default: [0.25, 0.27, 0.30, 0.33])
  Dmin_mm?: number;  // Minimum diameter for calculations (default: auto)
  Dmax_mm?: number;  // Maximum diameter for calculations (default: auto)

  // Methods to use
  methods?: ('Andreasen' | 'FunkDinger')[];  // Default: both
  packingModels?: ('CPM' | 'Furnas')[];  // Default: both

  // Scenarios to evaluate
  scenarios?: ('Self-compacting' | 'Flowable' | 'Vibratable' | 'Hand-pressable')[];

  // Processing parameters
  temperatureProfile_C?: number[];  // Firing temperatures (default: [600, 800, 1000, 1200])
  waterCementRatio?: number;  // For shrinkage calculations (default: 0.35)
  compactionPressure_MPa?: number;  // For CPM (default: scenario-dependent)

  // Base composition for differential calculation
  baseComposition?: BaseComposition[];

  // Calibration overrides
  calibration?: {
    cpmConstants?: { beta0?: number; K?: number };
    mscParams?: { activationEnergy_Jmol?: number; prefactor?: number };
    chemicalShrinkageCoeff?: number;
  };
}

/**
 * Optimization result container
 */
export interface OptimizationResult {
  timestamp: string;
  inputFractions: FractionInput[];
  options: OptimizationOptions;
  results: FinalProperties[];  // One per method/q/scenario combination
  summary: {
    bestSelfCompacting?: FinalProperties;
    bestFlowable?: FinalProperties;
    bestVibratable?: FinalProperties;
    bestHandPressed?: FinalProperties;
  };
  validation?: {
    warnings: string[];
    errors: string[];
    confidence: 'High' | 'Medium' | 'Low';
  };
}

/**
 * Mix library query options
 */
export interface MixLibraryQuery {
  tags?: string[];
  category?: string;
  method?: 'Andreasen' | 'FunkDinger';
  scenario?: string;
  createdAfter?: string;  // ISO date
  createdBefore?: string;
  searchText?: string;  // Search in name/description
}

/**
 * Scenario preset definition
 */
export interface ScenarioPreset {
  name: string;
  q: number;
  targetPhi: number;  // Target packing fraction
  compactionPressure_MPa: number;
  description: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

