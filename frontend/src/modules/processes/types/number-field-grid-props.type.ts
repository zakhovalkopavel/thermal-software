import type { NumberFieldSpec } from './number-field-spec.type';

export type NumberFieldGridProps<K extends string> = {
  fields: ReadonlyArray<NumberFieldSpec<K>>;
  values: Record<K, number | null>;
  onChange: (key: K, value: number | null) => void;
  /** Grid columns per field at md and up. */
  columns?: number;
};
