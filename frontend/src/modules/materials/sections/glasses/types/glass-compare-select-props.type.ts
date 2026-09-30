import type { MaterialEntry } from '../../../types/material-entry.type';

export type GlassCompareSelectProps = {
  references: MaterialEntry[];
  selected: string[];
  onChange: (selected: string[]) => void;
  /** Reference hidden because the user glass is that unedited preset. */
  duplicateId: string | null;
};
