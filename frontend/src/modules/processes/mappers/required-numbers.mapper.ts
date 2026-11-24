import type { NumberFieldSpec } from '../types/number-field-spec.type';

/** Throws a user-facing message for the first required field left empty. */
export function assertRequiredNumbers<K extends string>(fields: ReadonlyArray<NumberFieldSpec<K>>, values: Record<K, number | null>): void {
  const missing = fields.find((field) => field.required && values[field.key] === null);
  if (missing) throw new Error(`Enter ${missing.label}.`);
}
