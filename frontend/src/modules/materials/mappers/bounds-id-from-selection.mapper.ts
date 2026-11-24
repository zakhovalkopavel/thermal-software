import type { CompoundSelection } from '../types/compound-selection.type';

/** Bounds / API identity for a selection (registry key or compound id). */
export function boundsIdFromSelection(selection: CompoundSelection): string {
  return selection.source === 'registry' ? selection.key : selection.id;
}
