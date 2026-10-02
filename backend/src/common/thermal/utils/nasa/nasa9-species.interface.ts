import { Nasa9Equation } from '../../type/nasa9-equation';

export interface Nasa9Species {
  name: string;
  comment: string;
  refCode: string;
  phase: string;
  /** Molar mass [g/mol] */
  MW: number | null;
  /** Enthalpy of formation at 298.15 K [J/mol] */
  Hf298: number | null;
  nasa9: Nasa9Equation;
}
