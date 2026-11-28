import { useMemo, useState } from 'react';
import { Autocomplete, Box, CircularProgress, TextField, Typography, createFilterOptions } from '@mui/material';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { COMPOUND_AUTOCOMPLETE } from '../constants/compound-autocomplete.constants';
import { GASES_UI } from '../sections/gases/constants/gases-ui.constants';
import { useCompoundSearch } from '../hooks/useCompoundSearch';
import { useGasList } from '../hooks/useGasList';
import { optionFromSelection } from '../mappers/option-from-selection.mapper';
import { selectionFromOption } from '../mappers/selection-from-option.mapper';
import { toCatalogueCompoundOptions } from '../mappers/to-catalogue-compound-options.mapper';
import { toRegistryCompoundOptions } from '../mappers/to-registry-compound-options.mapper';
import type { CompoundAutocompleteOption } from '../types/compound-autocomplete-option.type';
import type { CompoundAutocompleteProps } from '../types/compound-autocomplete-props.type';

const filterRegistry = createFilterOptions<CompoundAutocompleteOption>({
  stringify: (option) => `${option.label} ${option.secondary} ${option.formula ?? ''} ${option.key ?? ''}`,
});

/**
 * One input for both the short fluid registry and async compound-data search.
 * Empty/open state shows registry; typing also queries the catalogue.
 */
export function CompoundAutocomplete({
  value,
  onChange,
  label = 'Gas',
  size = 'small',
  disabled,
  includeRegistry = true,
  gasesOnly = true,
  liquidsOnly = false,
  excludeIds = [],
}: CompoundAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const debouncedQ = useDebouncedValue(inputValue, COMPOUND_AUTOCOMPLETE.debounce_ms);
  const gasList = useGasList(includeRegistry && !liquidsOnly);
  const search = useCompoundSearch(
    debouncedQ,
    gasesOnly,
    debouncedQ.trim().length > 0,
    liquidsOnly,
  );

  const registryOptions = useMemo(() => {
    if (!includeRegistry || !gasList.data) return [];
    const hidden = [...excludeIds, ...(GASES_UI.excludedPickerIds as readonly string[])];
    return toRegistryCompoundOptions(gasList.data, hidden);
  }, [excludeIds, gasList.data, includeRegistry]);

  const catalogueOptions = useMemo(() => {
    const hits = search.data ?? [];
    const registryKeys = new Set(registryOptions.map((option) => option.key));
    const registryFormulas = new Set(
      registryOptions.map((option) => option.formula).filter((formula): formula is string => Boolean(formula)),
    );
    return toCatalogueCompoundOptions(hits).filter((option) => {
      if (excludeIds.includes(option.compoundId ?? '')) return false;
      // Prefer the registry row when the same species is already listed there.
      if (option.formula && registryFormulas.has(option.formula)) return false;
      if (option.compoundId && registryKeys.has(option.compoundId)) return false;
      return true;
    });
  }, [excludeIds, registryOptions, search.data]);

  const selected = optionFromSelection(value, registryOptions);
  const options = useMemo(() => {
    if (!debouncedQ.trim()) return registryOptions;
    const filteredRegistry = filterRegistry(registryOptions, {
      inputValue: debouncedQ,
      getOptionLabel: (option) => option.label,
    });
    return [...filteredRegistry, ...catalogueOptions];
  }, [catalogueOptions, debouncedQ, registryOptions]);

  const loading =
    (includeRegistry && gasList.isLoading) || (Boolean(debouncedQ.trim()) && search.isFetching);
  const error = gasList.error || search.error;

  return (
    <Autocomplete
      size={size}
      options={options}
      value={selected}
      inputValue={inputValue}
      loading={loading}
      disabled={disabled}
      filterOptions={(opts) => opts}
      groupBy={(option) => option.groupLabel}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, current) => option.optionId === current.optionId}
      onInputChange={(_, next, reason) => {
        if (reason === 'input' || reason === 'clear') setInputValue(next);
      }}
      onChange={(_, option) => {
        onChange(option ? selectionFromOption(option) : null);
        setInputValue(option?.label ?? '');
      }}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.optionId}>
          <Box>
            <Typography variant="body2">{option.label}</Typography>
            <Typography variant="caption" color="text.secondary">
              {option.secondary}
            </Typography>
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={Boolean(error)}
          helperText={error ? 'Compound search failed' : undefined}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
