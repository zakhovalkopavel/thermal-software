/** One record of `shared/processed/eutectic-data/nsrds-nbs-61-1.entries.json` (NSRDS-NBS 61, part 1). */
export type EutecticEntry = {
  /** Entry number in the source table */
  entry: number;

  /** System label, e.g. `Al2O3-CaO-SiO2` */
  system: string;

  /** Component formulas, same order as `composition_mol` */
  components: string[];

  /** Eutectic composition [mol%]; null when the source gives none */
  composition_mol: number[] | null;

  /** Eutectic temperature [°C]; null when the source gives none */
  temperature_C: number | null;

  /** Temperature uncertainty [°C] */
  uncertainty_C: number | null;

  /** Composition is approximate in the source */
  approximateComposition: boolean;

  /** Temperature is approximate in the source */
  approximateTemperature: boolean;

  /** Source reference ids */
  references: string[];

  /** Source notes */
  notes: string[];
};
