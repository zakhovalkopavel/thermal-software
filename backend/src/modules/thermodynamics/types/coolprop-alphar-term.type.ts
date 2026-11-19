/** One CoolProp residual Helmholtz term block from `EOS[].alphar`. */
export type CoolpropAlpharTerm =
  | {
      type: 'ResidualHelmholtzPower';
      n: readonly number[];
      t: readonly number[];
      d: readonly number[];
      l: readonly number[];
    }
  | {
      type: 'ResidualHelmholtzExponential';
      n: readonly number[];
      t: readonly number[];
      d: readonly number[];
      l: readonly number[];
      g: readonly number[];
    }
  | {
      type: 'ResidualHelmholtzGaussian';
      n: readonly number[];
      t: readonly number[];
      d: readonly number[];
      eta: readonly number[];
      epsilon: readonly number[];
      beta: readonly number[];
      gamma: readonly number[];
    }
  | {
      type: 'ResidualHelmholtzNonAnalytic';
      n: readonly number[];
      a: readonly number[];
      b: readonly number[];
      beta: readonly number[];
      A: readonly number[];
      B: readonly number[];
      C: readonly number[];
      D: readonly number[];
    }
  | {
      type: 'ResidualHelmholtzGaoB';
      n: readonly number[];
      t: readonly number[];
      d: readonly number[];
      eta: readonly number[];
      beta: readonly number[];
      gamma: readonly number[];
      epsilon: readonly number[];
      b: readonly number[];
    };
