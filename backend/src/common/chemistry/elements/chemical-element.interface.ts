export interface ChemicalElement {
  atomicNumber: number;
  name: string;
  /**
   * Abridged standard atomic weight Ar (numerically equal to the molar mass in g/mol);
   * null for elements without a standard atomic weight (no stable isotopes).
   */
  atomicWeight: number | null;
}
