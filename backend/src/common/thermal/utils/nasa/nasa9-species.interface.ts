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
  /** Element counts from the record's formula slots, e.g. { C: 1, H: 4 }; absent in files parsed before it was added */
  elements?: Record<string, number>;
}
