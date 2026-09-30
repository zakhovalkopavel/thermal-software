export const COMBUSTION = {
  FUEL_CAPACITY_J_KGK:    1_500,
  ASH_CAPACITY_J_KGK:     1_000,
  ATMOSPHERIC_PRESSURE_PA: 101_325,
  FLAME_ROOT_TOL:          1e-6,
  /** Flame temperature search range [K]; the upper end exceeds the cp data range (no dissociation in the model) */
  FLAME_T_MIN_K:           50,
  FLAME_T_MAX_K:           20_000,
  DEFAULT_PO2:             0.21,
  DEFAULT_W_H2OM:          0,
  /** Reference temperature of formation enthalpies [K] */
  T_REF_K:                 298.15,
  /** Relative tolerance of the water-gas shift extent root */
  WGS_ROOT_REL_TOL:        1e-12,
  /** Relative element-balance residual above which a step result is rejected */
  ELEMENT_BALANCE_TOL:     1e-9,
} as const;

/**
 * Bed kinetics — legacy furnaceCombustion/modules/ChemicalKinetics.js, taken without changes.
 * Refs: Laurendeau1978 pp. 221–270 (char surface reactions); Turns2012 pp. 120–145 (gas phase);
 *       Higman2008 pp. 78–95 (Boudouard, water-gas).
 * Rates r = A·exp(−E/(R·T))·Π p_i [atm]; surface rates per bed volume [mol/(m³·s)].
 */
export const BED_KINETICS = {
  /** Activation energies [J/mol] */
  E: {
    E1:  140000,        // C + O2 → CO2
    E2:  1.1 * 140000,  // 2C + O2 → 2CO
    E3:  2.2 * 140000,  // C + CO2 → 2CO (Boudouard)
    E31: 1.6 * 140000,  // C + H2O → CO + H2
    E32: 240000,        // C + 2H2O → CO2 + 2H2
    E33: 80000,         // C + 2H2 → CH4
    E4:  96300,         // 2CO + O2 → 2CO2
    E41: 70000,         // 2H2 + O2 → 2H2O
    E42: 125000,        // CH4 + 2O2 → CO2 + 2H2O
    E43: 90000,         // CO + H2O ⇌ CO2 + H2
  },
  /** Pre-exponential factors (literature-based, tuned) */
  A: {
    A1: 1e7,  A2: 5e6,  A3: 1e5,  A31: 1e4,
    A32: 1e4, A33: 1e3, A4: 1e10, A41: 1e11,
    A42: 1e9, A43: 1e7,
  },
  /** Standard heats of reaction [J/mol of reaction as written in E comments] */
  DH: {
    dH1: -393500, dH2: -110500, dH3: 172000, dH31: 131000, dH32: 90000,
    dH33: -75000, dH4: -283000, dH41: -241800, dH42: -802000, dH43: -41000,
  },
  /** Thiele modulus below which the effectiveness factor is 1 */
  PHI_MIN: 1e-2,
  /** Upper bound of the char temperature [K] (legacy T_MAX_K) */
  T_MAX_SOLID_K: 3000,
  /** Lower bound of the char temperature as a fraction of the gas temperature (endothermic layers) */
  T_SOLID_MIN_RATIO: 0.5,
  /** Downward scan step for the ignited root of the char energy balance [K] */
  SOLID_T_SCAN_STEP_K: 25,
  SOLID_T_TOL_K: 1e-3,
  /** brentq tolerance of the layer gas temperature [K]; errors add up over layers */
  GAS_T_ROOT_TOL: 1e-10,
  /** Legacy wall emissivity defaults (EPS_WALL_INNER_DEFAULT) */
  WALL_EMISSIVITY_DEFAULT: 0.85,
  /** Legacy default blast air flow [m³/h at inlet temperature] */
  AIR_FLOW_DEFAULT_M3H: 10,
  /** Default primary (blast) air temperature [K] */
  AIR_T_DEFAULT_K: 400,
  /** Furnace wall-loss / flame temperature fixed-point iterations */
  FURNACE_ITERATIONS: 50,
  FURNACE_TOL_K: 0.1,
  FURNACE_DAMPING: 0.5,
  /** Layer extents are scaled so no reaction consumes more than this share of an inlet species */
  MAX_CONSUMPTION_FRACTION: 1,
  LIMITER_ITERATIONS: 20,
} as const;

/** Molar masses [kg/mol] */
export const MOLAR_MASS = {
  N2:  0.028,
  O2:  0.032,
  CO2: 0.044,
  CO:  0.028,
  H2O: 0.018,
  H2:  0.002,
} as const;

/** Standard atomic weights [kg/mol] (ref IUPAC2021, conventional values) */
export const ATOMIC_MASS = {
  C: 0.012011,
  H: 0.001008,
  O: 0.015999,
  N: 0.014007,
  S: 0.03206,
} as const;

export type Element = keyof typeof ATOMIC_MASS;
export const ELEMENTS: readonly Element[] = ['C', 'H', 'O', 'N', 'S'];
