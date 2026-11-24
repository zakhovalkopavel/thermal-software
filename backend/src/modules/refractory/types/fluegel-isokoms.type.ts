/** Output from Fluegel 2007 polynomial regression before VTF fitting. */
export type FluegelIsokoms = {
  /** Temperature at log η = 1.5 Pa·s */
  T_logEta1_5: number;
  /** Temperature at log η = 6.6 Pa·s */
  T_logEta6_6: number;
  /** Temperature at log η = 12.0 Pa·s */
  T_logEta12: number;
  /** Warnings about components outside Fluegel validity bounds */
  warnings: string[];
};
