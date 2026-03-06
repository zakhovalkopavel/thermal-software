import { ViscosityModel } from '../enums/viscosity-model.enum';

/**
 * Glass Viscosity Model Coefficients
 *
 * Contains ONLY published, validated regression coefficients.
 * Previous file had 9 fake/wrong VFT parameter sets — removed 2026-03-06.
 * See docs/algorithms/glass-viscosity/VISCOSITY_PARAMETERS_AUDIT.md for audit.
 * See docs/algorithms/glass-viscosity/IMPLEMENTATION_PLAN.md for replacement strategy.
 *
 * Implemented models:
 *   1. Lakatos 1976  — isokom regression for soda-lime-silica (SiO₂ 60–77%, Na₂O 10–17%)
 *   2. Fluegel 2007  — polynomial regression for broad silicate glass space
 *   3. Hetherington 1964 — fixed Arrhenius for pure fused silica (SiO₂ > 99%)
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. LAKATOS 1976
//
// Source: shared/sources/lakatos_ocr/page_001_table_007.csv
// Formula: T(v) = C₀(v) + Σ Cᵢ(v)·xᵢ + C_B2O3²(v)·x_B2O3²
// where xᵢ = parts of component i per 100 parts of SiO₂ by weight
// Output: temperature in °C at log η = v (poise).
// Convert poise to Pa·s before VTF fitting: subtract 1 from the exponent.
// ─────────────────────────────────────────────────────────────────────────────

/** Lakatos 1976 isokom regression coefficients.
 *  Rows = components; columns = [constant, logEta2_poise, logEta4_poise, logEta6_poise].
 *  SiO₂ is the reference component and does NOT appear here.
 *  B₂O₃ has an additional quadratic term (last row).
 */
export const LAKATOS_1976_COEFFICIENTS = {
  /** Constant term for each viscosity level */
  constant: { v2: 1847.8, v4: 1249.7, v6: 962.9 },

  /** Per-component linear coefficients (°C per part per 100 parts SiO₂) */
  components: {
    Al2O3: { v2: 8.32,   v4: 5.23,   v6: 4.01  },
    Na2O:  { v2: -12.65, v4: -9.19,  v6: -7.06 },
    K2O:   { v2: -5.93,  v4: -4.17,  v6: -3.53 },
    Li2O:  { v2: -35.54, v4: -30.04, v6: -26.45 },
    CaO:   { v2: -11.27, v4: -3.99,  v6: -0.74 },
    MgO:   { v2: -5.87,  v4: -0.12,  v6:  0.91 },
    BaO:   { v2: -5.67,  v4: -3.04,  v6: -1.88 },
    ZnO:   { v2: -5.37,  v4: -1.88,  v6: -0.71 },
    PbO:   { v2: -4.85,  v4: -3.17,  v6: -2.24 },
    B2O3:  { v2: -21.62, v4: -11.97, v6: -6.42 }, // linear term
  } as const,

  /** B₂O₃ quadratic self-interaction (°C per (parts/100 SiO₂)²) */
  B2O3_quadratic: { v2: 0.5122, v4: 0.3182, v6: 0.19 },

  /** Lakatos outputs are in LOG POISE.  Subtract 1 to convert to log Pa·s. */
  outputUnit: 'log_poise' as const,

  /** Valid composition range for Lakatos model (wt%) */
  validityBounds: {
    SiO2:  { min: 50,  max: 77  }, // SiO₂ must be present as reference
    Na2O:  { min: 10,  max: 17  }, // Na₂O always present in training data
    Al2O3: { min: 0,   max: 8.26 },
    K2O:   { min: 0,   max: 8.70 },
    Li2O:  { min: 0,   max: 3.00 },
    CaO:   { min: 4.48,max: 13.32 },
    MgO:   { min: 0,   max: 6.00 },
    BaO:   { min: 0,   max: 16.54 },
    ZnO:   { min: 0,   max: 9.39 },
    PbO:   { min: 0,   max: 12.22 },
    B2O3:  { min: 0,   max: 14.37 },
  },

  reference: 'Lakatos, T.; Johansson, L-G.; Simmingskőld, B. (1976). "Viscosity-temperature relations in glasses composed of SiO₂-Al₂O₃-Na₂O-K₂O-Li₂O-CaO-MgO-BaO-ZnO-PbO-B₂O₃." August 1976 supplement.',
  accuracy: 'σ = 4.63°C at log η 1 Pa·s, 3.34°C at log η 3 Pa·s, 3.14°C at log η 5 Pa·s',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2. FLUEGEL 2007
//
// Source: shared/sources/fluegel_2007/Fluegel_table4.csv  (log η 1.5 Pa·s)
//         shared/sources/fluegel_2007/Fluegel_table5.csv  (log η 6.6 Pa·s)
//         shared/sources/fluegel_2007/Fluegel_table6.csv  (log η 12.0 Pa·s)
//         shared/sources/fluegel_2007/Fluegel_table3.csv  (per-component max bounds)
// Formula (Eq. 2 in paper):
//   T(v) = b₀ + Σᵢ bᵢ·Cᵢ + Σᵢ bᵢᵢ·Cᵢ² + Σᵢ bᵢᵢᵢ·Cᵢ³ + Σᵢ<ⱼ bᵢⱼ·CᵢCⱼ + ...
// where Cᵢ = mol% of component i in the full glass (SiO₂ included in denominator)
// SiO₂ is NOT a regression variable (it is the balance); set C_SiO₂ = 0.
// Outputs are already in log Pa·s — no unit conversion needed.
// ─────────────────────────────────────────────────────────────────────────────

/** Fluegel 2007 regression coefficients for log η = 1.5 Pa·s (Table 4).
 *  All Cᵢ are in mol% (full denominator including SiO₂). */
export const FLUEGEL_2007_T1_5 = {
  constant: 1824.497,
  linear: {
    Al2O3: 19.341,
    B2O3: -22.347,
    BaO: -18.931,
    Bi2O3: -42.416,
    CaO: -17.453,
    CeO2: -22.418,
    Cl: -8.563,
    CuO: -30.913,
    F: -11.739,
    Fe2O3: -13.611,
    K2O: -31.907,
    Li2O: -30.336,
    MgO: -5.038,
    MnO2: -17.050,
    Na2O: -30.610,
    Nd2O3: -39.662,
    PbO: -21.349,
    SO3: -13.908,
    SrO: -17.292,
    ThO2: -17.185,
    TiO2: -10.323,
    UO2: -17.672,
    V2O5: -21.727,
    ZnO: -6.280,
    ZrO2:  0.173,
  },
  quadratic: {
    B2O3:  0.60376,
    CaO:   0.12038,
    K2O:   0.61234,
    Li2O:  0.22499,
    Na2O:  0.27887,
  },
  cubic: {
    K2O:  -0.006662,
  },
  cross: {
    'K2O*MgO':          0.59449,
    'B2O3*Na2O':        0.28237,
    'B2O3*K2O':         0.2789,
    'B2O3*Li2O':        0.16843,
    'Al2O3*Na2O':       0.23085,
    'Al2O3*Li2O':       0.38421,
    'Al2O3*MgO':        0.44589,
    'Al2O3*CaO':        0.93909,
    'Na2O*K2O':         0.58773,
    'Na2O*Li2O':        0.20691,
    'Na2O*CaO':         0.19254,
    'K2O*Li2O':         0.24924,
    'K2O*CaO':          0.29628,
    'MgO*CaO':          0.17394,
  },
  cross3: {
    'Al2O3*Na2O*CaO':   0.03362,
  },
} as const;

/** Fluegel 2007 regression coefficients for log η = 6.6 Pa·s (Table 5). */
export const FLUEGEL_2007_T6_6 = {
  constant: 939.479,
  linear: {
    Al2O3:  5.812,
    B2O3:  -4.366,
    BaO:   -3.385,
    CaO:   -1.791,
    F:     -9.328,
    Fe2O3: -11.013,
    K2O:   -20.659,
    Li2O:  -25.075,
    MgO:    0.93,
    Na2O:  -19.051,
    P2O5:  14.857,
    PbO:   -8.871,
    SrO:   -2.191,
    TiO2:  -2.862,
    ZnO:   -1.065,
    ZrO2:  12.425,
  },
  quadratic: {
    B2O3: -0.17367,
    K2O:   0.58116,
    Li2O:  0.46012,
    Na2O:  0.32209,
  },
  cubic: {
    K2O:  -0.009370,
    Na2O: -0.002080,
  },
  cross: {
    'B2O3*Na2O':        0.32005,
    'B2O3*K2O':         0.42514,
    'B2O3*Li2O':        0.39626,
    'B2O3*CaO':        -0.24066,
    'Al2O3*Na2O':       0.08442,
    'Al2O3*K2O':        0.48055,
    'Na2O*K2O':         0.15519,
    'Na2O*Li2O':        0.20781,
    'Na2O*CaO':         0.09392,
    'K2O*Li2O':         0.46938,
    'K2O*MgO':          0.26354,
    'K2O*CaO':          0.47564,
    'MgO*CaO':         -0.15553,
  },
  cross3: {
    'B2O3*Al2O3*Na2O': -0.033573,
    'Al2O3*Na2O*CaO':  -0.006780,
    'Na2O*MgO*CaO':    -0.012589,
  },
} as const;

/** Fluegel 2007 regression coefficients for log η = 12.0 Pa·s (Table 6). */
export const FLUEGEL_2007_T12 = {
  constant: 624.829,
  linear: {
    Al2O3:  4.929,
    B2O3:  -1.121,
    BaO:   -1.110,
    CaO:    6.84,
    F:     -8.123,
    Fe2O3: -8.453,
    K2O:   -12.460,
    Li2O:  -11.571,
    MgO:    1.141,
    Na2O:  -12.854,
    PbO:   -4.349,
    SrO:    1.388,
    TiO2:   3.864,
    ZrO2:   8.927,
  },
  quadratic: {
    CaO:  -0.08269,
    K2O:   0.39706,
    Li2O:  0.27802,
    Na2O:  0.35785,
  },
  cubic: {
    K2O:  -0.005382,
    Li2O: -0.002576,
    Na2O: -0.004179,
  },
  cross: {
    'B2O3*Na2O':        0.38413,
    'B2O3*CaO':        -0.20958,
    'B2O3*Al2O3':      -0.33380,
    'Al2O3*CaO':       -0.13741,
    'Na2O*K2O':         0.06169,
    'Na2O*Li2O':        0.08558,
    'Na2O*CaO':        -0.10283,
    'K2O*Li2O':         0.17538,
    'K2O*MgO':          0.27425,
    'K2O*CaO':          0.2247,
    'MgO*CaO':         -0.21563,
    'CaO*Li2O':        -0.88170,
  },
  cross3: {
    'Al2O3*Na2O*CaO':   0.013868,
  },
} as const;

/** Maximum allowable component concentrations (mol%) for Fluegel 2007 validity.
 *  Source: shared/sources/fluegel_2007/Fluegel_table3.csv */
export const FLUEGEL_2007_BOUNDS = {
  /** [max at log η 1.5, max at log η 6.6, max at log η 12.0] */
  Al2O3:  [11.3,  12.7,  10.0  ],
  B2O3:   [18.15, 16.97, 16.97 ],
  BaO:    [10.0,   8.0,  19.2  ],
  CaO:    [33.47, 33.1,  50.14 ],
  F:      [10.31, 10.31,  4.55 ],
  Fe2O3:  [ 6.99,  2.15,  0.57 ],
  K2O:    [41.67, 30.0,  34.05 ],
  Li2O:   [35.9,  33.3,  45.0  ],
  MgO:    [16.9,  20.0,  16.61 ],
  MnO2:   [ 3.43,  0.18,  0.18 ],
  Na2O:   [44.0,  42.0,  42.0  ],
  P2O5:   [ 4.64,  0.85,  0.0  ],
  PbO:    [49.96, 50.0,  56.0  ],
  SrO:    [ 7.37,  7.37, 18.02 ],
  TiO2:   [ 9.26,  3.29, 25.0  ],
  ZnO:    [ 5.19,  8.0,   2.81 ],
  ZrO2:   [ 9.78,  2.77,  1.76 ],
  SiO2_min: 42.62,  // mol% SiO₂ minimum
  SiO2_max: 89.2,   // mol% SiO₂ maximum (for log η 1.5; 87.1 at 6.6; 92.0 at 12.0)
} as const;

/** Molar masses (g/mol) for wt% → mol% conversion */
export const MOLAR_MASSES: Record<string, number> = {
  SiO2:   60.08,
  Al2O3: 101.96,
  Na2O:   61.98,
  K2O:    94.20,
  Li2O:   29.88,
  CaO:    56.08,
  MgO:    40.30,
  BaO:   153.33,
  ZnO:    81.38,
  PbO:   223.20,
  B2O3:   69.62,
  Fe2O3: 159.69,
  TiO2:   79.87,
  ZrO2:  123.22,
  SrO:   103.62,
  MnO2:   86.94,
  P2O5:  141.94,
  F:      19.00,
  Cl:     35.45,
  SO3:    80.06,
  CeO2:  172.11,
  Nd2O3: 336.48,
  Bi2O3: 465.96,
  V2O5:  181.88,
  CuO:    79.55,
  ThO2:  264.04,
  UO2:   270.03,
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. HETHERINGTON 1964 — pure fused silica
//
// Source: Hetherington, G.; Jack, K.H.; Kennedy, J.C. (1964).
//   "The Viscosity of Vitreous Silica." Physics and Chemistry of Glasses 5(5):130–136.
// Formula: log₁₀(η [Pa·s]) = A + B/T  where T is in KELVIN (Arrhenius, not VFT)
// Valid: SiO₂ > 99 wt%, T = 1100–2300°C
// Note: T₀ = 0 (simple Arrhenius — no Vogel term).
// ─────────────────────────────────────────────────────────────────────────────

export const HETHERINGTON_1964 = {
  /** Pre-exponential constant (dimensionless) */
  A: -3.905,
  /** Activation energy / R in Kelvin */
  B: 31400,
  /** Minimum SiO₂ content for validity (wt%) */
  SiO2_min_wt: 99.0,
  /** Temperature range (°C) */
  temperatureRange: { min: 1100, max: 2300 },
  reference: 'Hetherington, G.; Jack, K.H.; Kennedy, J.C. (1964). "The Viscosity of Vitreous Silica." Physics and Chemistry of Glasses 5(5):130–136.',
} as const;
