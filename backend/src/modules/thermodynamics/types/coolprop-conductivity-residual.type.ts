/**
 * CoolProp `TRANSPORT.conductivity[].residual` shapes we evaluate
 * (NIST IR 8209 dedicated residual λʳ forms as in CoolProp / REFPROP).
 */
export type CoolpropConductivityResidual =
  | {
      type: 'polynomial';
      B: readonly number[];
      t: readonly number[];
      d: readonly number[];
      T_reducing: number;
      rhomass_reducing: number;
    }
  | {
      type: 'polynomial_and_exponential';
      A: readonly number[];
      t: readonly number[];
      d: readonly number[];
      gamma: readonly number[];
      l: readonly number[];
    };
