/** One CoolProp ideal-gas Helmholtz term from `EOS[].alpha0`. */
export type CoolpropAlpha0Term =
  | { type: 'IdealGasHelmholtzLead'; a1: number; a2: number }
  | { type: 'IdealGasHelmholtzLogTau'; a: number }
  | { type: 'IdealGasHelmholtzPower'; n: readonly number[]; t: readonly number[] }
  | {
      type: 'IdealGasHelmholtzPlanckEinstein';
      n: readonly number[];
      t: readonly number[];
    }
  | {
      type: 'IdealGasHelmholtzPlanckEinsteinFunctionT';
      n: readonly number[];
      v: readonly number[];
      Tcrit: number;
    }
  | {
      type: 'IdealGasHelmholtzEnthalpyEntropyOffset';
      a1: number;
      a2: number;
    }
  | {
      type: 'IdealGasHelmholtzCP0Constant';
      cp_over_R: number;
      Tc: number;
      T0: number;
    }
  | {
      type: 'IdealGasHelmholtzCP0PolyT';
      c: readonly number[];
      t: readonly number[];
      Tc: number;
      T0: number;
    };
