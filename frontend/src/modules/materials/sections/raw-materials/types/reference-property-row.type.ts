import type { ReferencePropertyKey } from './reference-property-key.type';

export type ReferencePropertyRow = {
  key: ReferencePropertyKey;
  label: string;
  unit?: string;
  digits?: number;
  value: number;
};
