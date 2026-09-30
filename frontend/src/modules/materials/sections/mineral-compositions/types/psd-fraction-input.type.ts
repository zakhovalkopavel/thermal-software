export type PsdFractionInput = {
  dMin_mm: number;
  dMax_mm: number;
  /** 0–1 */
  massFraction: number;
  isFixed?: boolean;
};
