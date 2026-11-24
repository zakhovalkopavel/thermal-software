/** Output from Lakatos 1976 isokom regression before VTF fitting. */
export type LakatosIsokoms = {
  /** Temperature at log η = 1 Pa·s (converted from 2 poise) */
  T_logEta1: number;
  /** Temperature at log η = 3 Pa·s (converted from 4 poise) */
  T_logEta3: number;
  /** Temperature at log η = 5 Pa·s (converted from 6 poise) */
  T_logEta5: number;
  /** Warnings about composition out of training range */
  warnings: string[];
};
