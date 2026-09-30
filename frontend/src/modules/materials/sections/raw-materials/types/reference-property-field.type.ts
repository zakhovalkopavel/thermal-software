import type { MaterialEntry } from '../../../types/material-entry.type';
import type { ReferencePropertyKey } from './reference-property-key.type';

export type ReferencePropertyField = {
  key: ReferencePropertyKey;
  label: string;
  unit?: string;
  digits?: number;
  read: (entry: MaterialEntry) => number | null | undefined;
};
