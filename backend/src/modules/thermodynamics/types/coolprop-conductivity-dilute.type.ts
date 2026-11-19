/**
 * CoolProp `TRANSPORT.conductivity[].dilute` shapes we evaluate.
 * Other dilute forms (`expression`, `hardcoded`, `eta0_and_poly`) fall back to
 * compound-data λ⁰(T).
 */
export type CoolpropConductivityDilute =
  | {
      type: 'ratio_of_polynomials';
      T_reducing: number;
      A: readonly number[];
      n: readonly number[];
      B: readonly number[];
      m: readonly number[];
    };
