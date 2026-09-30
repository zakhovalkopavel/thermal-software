import type { BodyGeometryDraft } from '../types/body-geometry-draft.type';
import type { BodyGeometryInput } from '../types/body-geometry-input.type';
import type { BodyShape } from '../types/body-shape.type';

/** Throws a user-facing message when a dimension is missing. */
export function toBodyGeometryInput(draft: BodyGeometryDraft, shape: BodyShape): BodyGeometryInput {
  const missing = shape.dims.find((dim) => draft.dims[dim.key] === null);
  if (missing) throw new Error(`Enter ${missing.label}.`);
  const dimensions = Object.fromEntries(shape.dims.map((dim) => [dim.key, draft.dims[dim.key]])) as BodyGeometryInput['dimensions'];
  return { geometry: shape.value, dimensions, ...(shape.usesInsulation && draft.h !== null ? { h: draft.h } : {}) };
}
