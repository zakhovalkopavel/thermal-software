export interface GasPhaseRates {
  /** 2CO + O2 → 2CO2 (per mol O2) */
  r4:  number;
  /** 2H2 + O2 → 2H2O (per mol O2) */
  r41: number;
  /** CH4 + 2O2 → CO2 + 2H2O */
  r42: number;
  /** CO + H2O ⇌ CO2 + H2 (net forward) */
  r43: number;
}
