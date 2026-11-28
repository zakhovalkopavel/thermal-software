import type { CompoundSelection } from '../../../types/compound-selection.type';

/** Placeholder selection until the catalogue search resolves the deep-link id. */
export function selectionFromCompoundParam(compoundId: string | null): CompoundSelection | null {
  if (!compoundId) return null;
  return {
    source: 'compound',
    id: compoundId,
    label: compoundId.replaceAll('_', ' '),
    formula: '',
    displayFormula: '',
    cas: null,
  };
}
