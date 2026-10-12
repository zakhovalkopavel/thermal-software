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
  /** Element counts from the header's formula slots, e.g. { C: 1, H: 4 }; absent in files parsed before it was added */
  elements?: Record<string, number>;
}
