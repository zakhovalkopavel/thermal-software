import { COMPOUND_AUTOCOMPLETE } from '../constants/compound-autocomplete.constants';
import type { CompoundAutocompleteOption } from '../types/compound-autocomplete-option.type';
import type { CompoundSearchHit } from '../types/compound-search-hit.type';

function groupLabelFor(hit: CompoundSearchHit): string {
  const key = hit.class?.toLowerCase();
  if (key && key in COMPOUND_AUTOCOMPLETE.classGroupLabels) {
    return COMPOUND_AUTOCOMPLETE.classGroupLabels[key as keyof typeof COMPOUND_AUTOCOMPLETE.classGroupLabels];
  }
  return COMPOUND_AUTOCOMPLETE.catalogueGroup;
}

export function toCatalogueCompoundOptions(hits: CompoundSearchHit[]): CompoundAutocompleteOption[] {
  return hits.map((hit) => {
    const compoundId = hit.compoundId ?? hit.id;
    return {
      optionId: `compound:${compoundId}`,
      source: 'compound' as const,
      compoundId,
      label: hit.name,
      secondary: [hit.cas, hit.displayFormula, hit.class, hit.group].filter(Boolean).join(' · '),
      groupLabel: groupLabelFor(hit),
      formula: hit.formula,
      displayFormula: hit.displayFormula,
      cas: hit.cas,
      className: hit.class,
      group: hit.group,
    };
  });
}
