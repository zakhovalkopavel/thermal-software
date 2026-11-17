import { JanafRow } from './janaf-row.interface';

/**
 * `units.json`: unit of every row column, e.g. `Cp` "J/(mol K)", `dfH` "kJ/mol", `logKf` "1" (dimensionless).
 * `$comment` is a header line (standard state, Tr) followed by one `"<column>: <definition>"` line per row field,
 * including `note`.
 */
export interface JanafUnitsFile {
  $comment: string[];
  rows: Record<Exclude<keyof JanafRow, 'note'>, string>;
}
