import { COMPOUND_AUTOCOMPLETE } from '../constants/compound-autocomplete.constants';
import type { CompoundAutocompleteOption } from '../types/compound-autocomplete-option.type';
import type { CompoundSelection } from '../types/compound-selection.type';

export function optionFromSelection(
  selection: CompoundSelection | null,
  registry: CompoundAutocompleteOption[],
): CompoundAutocompleteOption | null {
  if (!selection) return null;
  if (selection.source === 'registry') {
    return (
      registry.find((option) => option.key === selection.key) ?? {
        optionId: `registry:${selection.key}`,
        source: 'registry',
        key: selection.key,
        label: selection.label,
        secondary: selection.key,
        groupLabel: COMPOUND_AUTOCOMPLETE.registryGroup,
        formula: selection.formula,
      }
    );
  }
  return {
    optionId: `compound:${selection.id}`,
    source: 'compound',
    compoundId: selection.id,
    label: selection.label,
    secondary: [selection.cas, selection.displayFormula].filter(Boolean).join(' · '),
    groupLabel: COMPOUND_AUTOCOMPLETE.catalogueGroup,
    formula: selection.formula,
    displayFormula: selection.displayFormula,
    cas: selection.cas,
  };
}
