export type PsdResult = {
  method: string;
  q: number;
  /** Ideal mass fractions 0–1, in request order. */
  massFractions: number[];
  massFractionsRoundedPercent: number[];
  Dmin_mm: number;
  Dmax_mm: number;
};
