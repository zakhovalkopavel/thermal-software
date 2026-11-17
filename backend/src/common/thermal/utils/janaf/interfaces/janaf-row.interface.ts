/**
 * One temperature row of a NIST-JANAF table; empty and infinite cells are left out.
 * Tr = 298.15 K. The units below are also listed in `units.json` (`JanafUnitsFile`).
 */
export interface JanafRow {
  /** Temperature, K */
  T: number;
  /** Heat capacity, J/(mol·K) */
  Cp?: number;
  /** Entropy, J/(mol·K) */
  S?: number;
  /** Gibbs energy function −[G − H(Tr)]/T, J/(mol·K) */
  gef?: number;
  /** Enthalpy increment H − H(Tr), kJ/mol */
  dH?: number;
  /** Enthalpy of formation, kJ/mol */
  dfH?: number;
  /** Gibbs energy of formation, kJ/mol */
  dfG?: number;
  /** Decimal logarithm of the equilibrium constant of formation, dimensionless */
  logKf?: number;
  /** Text found in place of dfH/dfG/logKf, e.g. "CRYSTAL <--> LIQUID" or "TRANSITION" */
  note?: string;
}
