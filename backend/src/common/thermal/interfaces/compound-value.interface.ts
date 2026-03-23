import { EquationValue } from './equation-value.interface';

export interface CompoundValue {
  readonly name: string;
  readonly chemicalFormula: string;
  /** Molar mass [kg/mol] */
  readonly Mr: number;
  /** Standard enthalpy of formation at 298 K [J/mol] */
  readonly enthalpyFormation298: number;
  /** Standard Gibbs energy at 298 K [J/mol] */
  readonly gibbsEnergy298: number;
  /** Lennard-Jones collision diameter σ [Å] — ref 7 */
  readonly collisionDiameter: number;
  /** ε/kB [K] — LJ energy depth / Boltzmann constant — ref 7 */
  readonly epsilonToKb: number;
  /**
   * Sutherland viscosity parameters: μ = μ0·(T/T0)^1.5·(T0+S)/(T+S)
   * mu0 [Pa·s] at reference temperature T0 [K], S [K] Sutherland constant
   */
  readonly sutherlandParams?: { mu0: number; T0: number; S: number };
  readonly gibbsEnergy?: {
    reagents: string[];
    value: EquationValue;
  };
  /** Isobaric molar heat capacity [J/(mol·K)] */
  readonly heatCapacity: {
    def: number;
    values: EquationValue[];
  };
  readonly viscosity: {
    def: number;
    values: EquationValue[];
  };
  readonly thermalConductivity: {
    def: number;
    values: EquationValue[];
  };
}

