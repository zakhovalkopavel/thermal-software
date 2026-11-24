import { COMPOUND_AUTOCOMPLETE } from '../constants/compound-autocomplete.constants';
import type { CompoundAutocompleteOption } from '../types/compound-autocomplete-option.type';
import type { GasListEntry } from '../types/gas-list-entry.type';

export function toRegistryCompoundOptions(
  gases: GasListEntry[],
  excludeIds: string[] = [],
): CompoundAutocompleteOption[] {
  const excluded = new Set(excludeIds);
  return gases
    .filter((gas) => !excluded.has(gas.key))
    .map((gas) => ({
      optionId: `registry:${gas.key}`,
      source: 'registry' as const,
      key: gas.key,
      label: gas.formula && gas.formula !== gas.name ? `${gas.name} (${gas.formula})` : gas.name,
      secondary: gas.key,
      groupLabel: COMPOUND_AUTOCOMPLETE.registryGroup,
      formula: gas.formula,
    }));
}
