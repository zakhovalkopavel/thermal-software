/** One row from CoolProp `mixture_binary_pairs.json`. */
export type CoolpropBinaryPair = {
  Name1: string;
  Name2: string;
  CAS1?: string;
  CAS2?: string;
  function?: string;
  F?: number;
  xi?: number;
  zeta?: number;
  betaT?: number;
  gammaT?: number;
  betaV?: number;
  gammaV?: number;
  BibTeX?: string;
};
