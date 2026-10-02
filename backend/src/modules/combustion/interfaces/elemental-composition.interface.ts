/** As-fired elemental analysis, mass fractions [-]; C + H + O + N + S + ash + moisture = 1 */
export interface ElementalComposition {
  C:   number;
  H:   number;
  O:   number;
  N:   number;
  S?:  number;
  ash: number;
  /** Free (liquid) water in the fuel */
  moisture?: number;
}
