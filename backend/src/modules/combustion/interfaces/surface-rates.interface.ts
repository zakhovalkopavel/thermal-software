export interface SurfaceRates {
  /** C + O2 → CO2 */
  r1:  number;
  /** 2C + O2 → 2CO (per mol O2) */
  r2:  number;
  /** C + CO2 → 2CO */
  r3:  number;
  /** C + H2O → CO + H2 */
  r31: number;
  /** C + 2H2O → CO2 + 2H2 */
  r32: number;
  /** C + 2H2 → CH4 */
  r33: number;
  /** External specific surface of the bed [m²/m³] */
  a_s: number;
}
