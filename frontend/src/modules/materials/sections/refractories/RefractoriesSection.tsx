import { useMemo, useState } from 'react';
import { Alert, Box, Stack, Typography } from '@mui/material';
import { CalculateButton, CalculatorPage, ResultPanel } from '../../../../components/calc';
import { TemperatureSweepFields } from '../../components/TemperatureSweepFields';
import { useRefractoryProducts } from '../../hooks/useRefractoryProducts';
import { useSearchParamState } from '../../hooks/useSearchParamState';
import { toRefractoryGroups } from '../../mappers/refractory-groups.mapper';
import { toTemperatureGrid } from '../../mappers/temperature-grid.mapper';
import type { TemperatureSweep } from '../../types/temperature-sweep.type';
import { REFRACTORIES_UI } from './constants/refractories-ui.constants';
import { useRefractoryProperties } from './hooks/useRefractoryProperties';
import { RefractoryCatalogList } from './RefractoryCatalogList';
import { RefractoryResults } from './RefractoryResults';
import type { RefractoryPropertiesRequest } from './types/refractory-properties-request.type';

export function RefractoriesSection() {
  const [materialParam, setMaterialParam] = useSearchParamState('material');
  const products = useRefractoryProducts();
  const [selected, setSelected] = useState<string[]>(materialParam ? [materialParam] : []);
  const [sweep, setSweep] = useState<TemperatureSweep>(REFRACTORIES_UI.defaultSweep);
  const [request, setRequest] = useState<RefractoryPropertiesRequest | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const result = useRefractoryProperties(request);

  const catalog = useMemo(() => products.data ?? [], [products.data]);
  const groups = useMemo(() => toRefractoryGroups(catalog), [catalog]);
  const known = selected.filter((id) => catalog.some((product) => product.materialId === id));
  const unknownParam = Boolean(materialParam && products.data && !catalog.some((p) => p.materialId === materialParam));

  const changeSelection = (next: string[]) => {
    setSelected(next);
    if (next[0] !== selected[0]) setMaterialParam(next[0] ?? null);
  };

  const calculate = () => {
    if (known.length === 0) return setFormError('Select at least one product.');
    try {
      setRequest({ mode: sweep.mode, materials: known, temperatures_K: toTemperatureGrid(sweep) });
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <CalculatorPage
      title="Refractories"
      description="Known refractory and insulation products: temperature-dependent λ and ε."
      inputs={
        <Stack
          spacing={2}
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            calculate();
          }}
        >
          {unknownParam && <Alert severity="info">Unknown product “{materialParam}” in the link — ignored.</Alert>}
          <Typography variant="subtitle2">Products (compare up to {REFRACTORIES_UI.maxCompared})</Typography>
          <RefractoryCatalogList
            groups={groups}
            selected={known}
            onChange={changeSelection}
            max={REFRACTORIES_UI.maxCompared}
          />
          <Typography variant="subtitle2">Temperature</Typography>
          <TemperatureSweepFields value={sweep} onChange={setSweep} />
          {formError && <Alert severity="warning">{formError}</Alert>}
          <Box>
            <CalculateButton loading={result.isLoading} disabled={known.length === 0} />
          </Box>
        </Stack>
      }
      results={
        <ResultPanel
          loading={result.isLoading}
          error={result.error ?? products.error}
          hasResult={Boolean(request) && result.isComplete}
        >
          {request && <RefractoryResults request={request} products={catalog} byMaterial={result.byMaterial} />}
        </ResultPanel>
      }
    />
  );
}
