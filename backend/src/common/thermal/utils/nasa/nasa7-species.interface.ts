import { Nasa7Equation } from '../../type/nasa7-equation';

export interface Nasa7Species {
  name: string;
  comment: string;
  phase: string;
  /** Molar mass [g/mol] */
  MW: number | null;
  /** Validity range [K] */
  Tmin: number;
  Tmax: number;
  nasa7: Nasa7Equation;
}
