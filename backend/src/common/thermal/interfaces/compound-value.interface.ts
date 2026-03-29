import { EquationValue } from './equation-value.interface';
import { Nasa7Equation } from '../type/nasa7-equation';

/**
 * Complete thermophysical data for a pure-component gas.
 *
 * Property resolution order (hidden from callers — use CompoundPropertyResolver):
 *   Each multi-value property has a `def` index that selects the default
 *   approximation. Callers may override by passing a preferred index or RefKey.
 *
 * nasa7 is kept separate because it simultaneously covers Cp, H, S and G
 * through a single set of coefficients — it does not belong to any single
 * property bucket.
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
  /** Standard enthalpy of formation at 298 K [J/mol] */
  readonly enthalpyFormation298: number;
  /** Standard Gibbs energy at 298 K [J/mol] */
  readonly gibbsEnergy298: number;
  /** Lennard-Jones collision diameter σ [Å] — ref Poling7 */
  readonly collisionDiameter: number;
  /** ε/kB [K] — LJ energy depth / Boltzmann constant — ref Poling7 */
  readonly epsilonToKb: number;
  /**
   * Sutherland viscosity parameters: μ = μ0·(T/T0)^1.5·(T0+S)/(T+S)
   * mu0 [Pa·s] at reference temperature T0 [K], S [K] Sutherland constant.
   * ref White3
   */
  readonly sutherlandParams?: { mu0: number; T0: number; S: number };

  /**
   * NASA 7-coefficient polynomial dataset.
   * Covers Cp, H, S, G for the full range 200–6000 K.
   * Kept separate from heatCapacity because it is not a single-property fit.
   */
  readonly nasa7?: Nasa7Equation;

  /** Gibbs energy of formation as a function of T (polynomial fit) */
  readonly gibbsEnergy?: {
    reagents: string[];
    value: EquationValue;
  };

  /** Isobaric molar heat capacity Cp [J/(mol·K)] */
  readonly heatCapacity: {
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

