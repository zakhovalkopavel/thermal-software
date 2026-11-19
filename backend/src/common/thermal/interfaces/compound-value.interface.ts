import { EquationValue } from './equation-value.interface';

/**
 * Complete thermophysical data for a pure-component gas.
 *
 * Property resolution order (hidden from callers — use CompoundPropertyResolver):
 *   Each multi-value property has a `def` index that selects the default
 *   approximation. Callers may override by passing a preferred index or RefKey.
 *
 * NASA-7 / NASA-9 data simultaneously covers Cp, H, S and G through a single set of
 * coefficients — it does not belong to any single property bucket. It is not stored
 * here: `nasa7Key` / `nasa9Key` point into the NASA databases (`utils/nasa-database.ts`).
 */
export interface CompoundValue {
  readonly name: string;
  readonly chemicalFormula: string;
  /** Molar mass [kg/mol] */
  readonly Mr: number;
  /**
   * When `true`, this compound is a defined composition of individual pure-component
   * species rather than a single pure substance. Pair with `composition` (mole fractions).
   */
  readonly isComposition?: true;
  /**
   * Mole fractions by species key (e.g. `{ N2: 0.78084, O2: 0.20946, … }`).
   * Required when `isComposition` is set — used when a property bucket is empty
   * and the mixture must be evaluated from constituents.
   */
  readonly composition?: Readonly<Record<string, number>>;
  /**
   * Standard enthalpy of formation at 298 K [J/mol].
   * Optional when `nasa7Key` / `nasa9Key` is given (the NASA datasets encode ΔHf).
   */
  readonly enthalpyFormation298?: number;
  /** Standard Gibbs energy at 298 K [J/mol]; optional like `enthalpyFormation298` */
  readonly gibbsEnergy298?: number;
  /** Lennard-Jones / Stockmayer collision diameter σ [Å] — ref Poling5; absent when no published value exists */
  readonly collisionDiameter?: number;
  /** ε/kB [K] — LJ energy depth / Boltzmann constant — ref Poling5; absent like `collisionDiameter` */
  readonly epsilonToKb?: number;
  /** Stockmayer polar parameter δ [-] (Itean1961 / Svehla1995); absent when nonpolar or unknown */
  readonly stockmayerDelta?: number;
  /** Critical temperature [K]; first listed compound-data source */
  readonly criticalTemperature?: number;
  /** Critical pressure [Pa]; first listed compound-data source */
  readonly criticalPressure?: number;
  /** Critical molar volume [m³/mol]; first listed compound-data source */
  readonly criticalVolume?: number;
  /** Acentric factor [-]; first listed compound-data source */
  readonly acentricFactor?: number;
  /** Dipole moment [C·m]; first listed compound-data source */
  readonly dipoleMoment?: number;
  /**
   * CoolProp fluid `INFO.NAME` for Helmholtz EOS density
   * (`shared/sources/coolprop/fluids/<NAME>.json`), from compound-data `coolprop[0]`.
   * Absent → Peng–Robinson when \(T_c,P_c,\omega\) exist, else limited ideal gas.
   */
  readonly coolpropKey?: string;

  /**
   * Exact species key in `shared/processed/NASA/nasa7.json` (ref NASA7), e.g. "N2", "C4H10,isobutane".
   * The NASA-7 coefficients (Cp, H, S, G) are read from there — see `compoundNasa7`.
   */
  readonly nasa7Key?: string;

  /**
   * Exact species key in `shared/processed/NASA/nasa9.json` (ref NASA9), e.g. "N2", "Air".
   * The NASA-9 coefficients are read from there — see `compoundNasa9`.
   */
  readonly nasa9Key?: string;

  /** Gibbs energy of formation as a function of T (polynomial fit) */
  readonly gibbsEnergy?: {
    reagents: string[];
    value: EquationValue;
  };

  /**
   * Tabulated isobaric molar heat capacity fits Cp [J/(mol·K)].
   * Optional when `nasa7Key` / `nasa9Key` is given: the NASA datasets are evaluated directly
   * (see `heatCapacityEntries`) and are not repeated here. One of the three is required.
   */
  readonly heatCapacity?: {
    /** Index of the default approximation in `values` */
    def: number;
    values: EquationValue[];
  };

  /** Dynamic viscosity μ [Pa·s] */
  readonly viscosity: {
    def: number;
    values: EquationValue[];
  };

  /** Thermal conductivity λ [W/(m·K)] */
  readonly thermalConductivity: {
    def: number;
    values: EquationValue[];
  };
}

