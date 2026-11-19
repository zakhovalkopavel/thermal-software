/**
 * Wire shape of CoolProp `TRANSPORT.conductivity[].residual` (vendored JSON).
 * Evaluated forms: `polynomial`, `polynomial_and_exponential`.
 */
export type CoolpropConductivityResidualJson =
  | {
      type: 'polynomial';
      B: number[];
      t: number[];
      d: number[];
      T_reducing: number;
      T_reducing_units?: string;
      rhomass_reducing: number;
      rhomass_reducing_units?: string;
    }
  | {
      type: 'polynomial_and_exponential';
      A: number[];
      t: number[];
      d: number[];
      gamma: number[];
      l: number[];
    }
  | {
      type: 'expression';
      formula?: string;
      note?: string;
      state_variables?: string[];
      constants?: Record<string, number>;
      arrays?: Record<string, number[]>;
    };
