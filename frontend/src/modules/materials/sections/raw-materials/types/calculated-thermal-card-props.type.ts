import type { MaterialEntry } from '../../../types/material-entry.type';

export type CalculatedThermalCardProps = {
  material: MaterialEntry;
  /** The material is listed by E9 (mix components). */
  eligible: boolean;
  /** Compared materials listed by E9, without the selected one. */
  comparedEligible: MaterialEntry[];
};
