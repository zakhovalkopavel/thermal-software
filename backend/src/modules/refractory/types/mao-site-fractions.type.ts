/** Cation / anion site fractions of the Mao ionic CAS liquid. */
export type MaoSiteFractions = {
  /** y(Al³⁺), y(Ca²⁺) on the cation sublattice */
  cations: { Al: number; Ca: number };
  /** y(AlO₂⁻), y(O²⁻), y(SiO₄⁴⁻), y(SiO₂⁰) on the anion sublattice */
  anions: { AlO2: number; O: number; SiO4: number; SiO2: number };
  /** Average cation charge Q */
  Q: number;
  /** Average anion charge magnitude P */
  P: number;
};
