type WithoutNulls<T> = { [K in keyof T]?: Exclude<T[K], null> };

/** Drops null / undefined entries so optional DTO fields are omitted instead of sent as null. */
export function withoutNulls<T extends Record<string, unknown>>(values: T): WithoutNulls<T> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== null && value !== undefined)) as WithoutNulls<T>;
}
