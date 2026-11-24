import type { CompoundAutocompleteOption } from '../types/compound-autocomplete-option.type';
import type { CompoundSelection } from '../types/compound-selection.type';

export function selectionFromOption(option: CompoundAutocompleteOption): CompoundSelection {
  if (option.source === 'registry') {
    return {
      source: 'registry',
      key: option.key!,
      label: option.label,
      formula: option.formula,
    };
  }
  return {
    source: 'compound',
    id: option.compoundId!,
    label: option.label,
    formula: option.formula ?? option.displayFormula ?? '',
    displayFormula: option.displayFormula ?? option.formula ?? '',
    cas: option.cas ?? null,
  };
}
