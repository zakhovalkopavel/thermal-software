import type { MaterialEntry } from './material-entry.type';
import type { MaterialGroup } from './material-group.type';

export type MaterialCategory = {
  group: MaterialGroup;
  label: string;
  materials: MaterialEntry[];
};
