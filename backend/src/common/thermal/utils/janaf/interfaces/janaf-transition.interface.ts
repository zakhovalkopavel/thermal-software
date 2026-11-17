/** Phase transition row of a JANAF table, e.g. 2130 K "CRYSTAL <--> LIQUID" */
export interface JanafTransition {
  /** Temperature, K */
  T: number;
  label: string;
  /** 1-based line of the row in the table file (same file as `JanafTable.ref`) */
  line: number;
}
