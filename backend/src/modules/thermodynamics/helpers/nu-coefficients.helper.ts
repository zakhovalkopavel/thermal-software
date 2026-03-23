/**
 * Lookup-table helpers for Nu correlation coefficients.
 * All tables taken directly from original source works (not approximated).
 */

/** Hilpert (1933) range table: Nu = C·Re^m·Pr^(1/3)
 * Source: Hilpert R. (1933) Forsch. Geb. Ingenieurwes. 4:215
 * Ranges: Re [0.4–4×10⁵]
 */
export function hilpertCoeffs(Re: number): [C: number, m: number] {
  if (Re < 4)     return [0.989, 0.330];
  if (Re < 40)    return [0.911, 0.385];
  if (Re < 4000)  return [0.683, 0.466];
  if (Re < 40000) return [0.193, 0.618];
  return [0.027, 0.805];
}

/** Morgan (1975) range table: Nu = C·Ra^n for horizontal cylinders
 * Source: Morgan V.T. (1975) Adv. Heat Transfer 11:199
 * Ranges: Ra [10⁻¹⁰–10¹²]
 */
export function morganCoeffs(Ra: number): [C: number, n: number] {
  if (Ra < 1e-2)  return [0.675, 0.058];
  if (Ra < 1e2)   return [1.02,  0.148];
  if (Ra < 1e4)   return [0.850, 0.188];
  if (Ra < 1e7)   return [0.480, 0.250];
  return [0.125, 0.333];
}

/** Zukauskas (1972) range table: Nu = C1·Re^m for tube banks
 * Source: Zukauskas A. (1972) Adv. Heat Transfer 8:93
 * Ranges: Re_max [10–2×10⁶]
 */
export function zukauskasCoeffs(Re_max: number, staggered: boolean, ST: number, SL: number): [C1: number, m: number] {
  if (Re_max < 100)  return [staggered ? 0.90 : 0.80, 0.40];
  if (Re_max < 1e3)  return [staggered ? 0.35 * Math.pow(ST / SL, 0.2) : 0.27, 0.63];
  if (Re_max < 2e5)  return [staggered ? 0.40 : 0.21, 0.70];
  return [staggered ? 0.022 : 0.021, 0.84];
}

/** MacGregor & Emery (1969) — vertical cavity natural convection
 * Source: MacGregor R.K., Emery A.P. (1969) J. Heat Transfer 91:391
 * Ranges: H/L ≤ 40, Ra [10³–10¹⁰]
 */
export function macGregorEmery(Ra: number, HL: number, Pr: number): number {
  if (HL <= 2 && Ra >= 1e4 && Ra <= 1e7)
    return 0.18 * Math.pow(Pr / (0.2 + Pr) * Ra, 0.29);
  if (HL <= 10 && Ra >= 1e3 && Ra <= 1e10)
    return 0.22 * Math.pow(Pr / (0.2 + Pr) * Ra, 0.28) * Math.pow(HL, -0.25);
  if (HL <= 40 && Ra >= 1e4 && Ra <= 1e7)
    return 0.42 * Math.pow(Ra, 0.25) * Math.pow(Pr, 0.012) * Math.pow(HL, -0.3);
  return 0.046 * Math.pow(Ra, 1/3);
}

