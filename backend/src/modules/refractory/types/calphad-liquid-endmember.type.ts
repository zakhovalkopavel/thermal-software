/** Liquid oxide end-member used for ideal-mixing liquid G in Engine C. */
export type CalphadLiquidEndmember = {
  /** Oxide formula key matching matrix composition (e.g. `Al2O3`) */
  oxide: string;
  /** Public compound-data id */
  compoundId: string;
  /** Preferred NASA-9 liquid species key */
  nasa9Key: string;
};
