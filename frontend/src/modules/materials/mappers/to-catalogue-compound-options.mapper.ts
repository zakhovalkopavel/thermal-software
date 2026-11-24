import { COMPOUND_AUTOCOMPLETE } from '../constants/compound-autocomplete.constants';
import type { CompoundAutocompleteOption } from '../types/compound-autocomplete-option.type';
import type { CompoundSearchHit } from '../types/compound-search-hit.type';

export function toCatalogueCompoundOptions(hits: CompoundSearchHit[]): CompoundAutocompleteOption[] {
  return hits.map((hit) => {
    const compoundId = hit.compoundId ?? hit.id;
    return {
      optionId: `compound:${compoundId}`,
      source: 'compound' as const,
      compoundId,
      label: hit.name,
      secondary: [hit.cas, hit.displayFormula].filter(Boolean).join(' · '),
      groupLabel: COMPOUND_AUTOCOMPLETE.catalogueGroup,
      formula: hit.formula,
      displayFormula: hit.displayFormula,
      cas: hit.cas,
    };
  });
}
