/**
 * Wire shape of CoolProp `TRANSPORT.conductivity[].dilute` (vendored JSON).
 * Only `ratio_of_polynomials` is evaluated; other variants are typed for parsing.
 */
export type CoolpropConductivityDiluteJson =
  | {
      type: 'ratio_of_polynomials';
      T_reducing: number;
      T_reducing_units?: string;
      A: number[];
      n: number[];
      B: number[];
      m: number[];
    }
  | {
      type: 'eta0_and_poly';
      A: number[];
      t: number[];
    }
  | {
      type: 'expression';
      formula?: string;
      note?: string;
      state_variables?: string[];
      constants?: Record<string, number>;
      arrays?: Record<string, number[]>;
    }
  | {
      hardcoded: string;
    };
