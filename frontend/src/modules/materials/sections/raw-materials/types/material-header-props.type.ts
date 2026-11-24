import type { MaterialEntry } from '../../../types/material-entry.type';
import type { MaterialGroup } from '../../../types/material-group.type';

export type MaterialHeaderProps = {
  material: MaterialEntry;
  groupLabels: Partial<Record<MaterialGroup, string>>;
  canCompare: boolean;
  compared: boolean;
  onCompare: () => void;
};
