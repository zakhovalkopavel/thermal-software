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
   * species rather than a single pure substance.  The exact mole fractions are
   * stored in a corresponding `*Composition` constant under `compound/composition/`.
   */
  readonly isComposition?: true;
  /**
   * Standard enthalpy of formation at 298 K [J/mol].
   * Optional when `nasa7Key` / `nasa9Key` is given (the NASA datasets encode ΔHf).
   */
  readonly enthalpyFormation298?: number;
  /** Standard Gibbs energy at 298 K [J/mol]; optional like `enthalpyFormation298` */
  readonly gibbsEnergy298?: number;
  /** Lennard-Jones collision diameter σ [Å] — ref Poling5; absent when no published value exists */
  readonly collisionDiameter?: number;
  /** ε/kB [K] — LJ energy depth / Boltzmann constant — ref Poling5; absent like `collisionDiameter` */
  readonly epsilonToKb?: number;
  /**
   * Sutherland viscosity parameters: μ = μ0·(T/T0)^1.5·(T0+S)/(T+S)
   * mu0 [Pa·s] at reference temperature T0 [K], S [K] Sutherland constant.
   * ref White3 unless the compound file cites another source
   */
  readonly sutherlandParams?: { mu0: number; T0: number; S: number };

  /**
   * Exact species key in `backend/data/nasa/nasa7.json` (ref NASA7), e.g. "N2", "C4H10,isobutane".
   * The NASA-7 coefficients (Cp, H, S, G) are read from there — see `compoundNasa7`.
   */
  readonly nasa7Key?: string;

  /**
   * Exact species key in `backend/data/nasa/nasa9.json` (ref NASA9), e.g. "N2", "Air".
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

