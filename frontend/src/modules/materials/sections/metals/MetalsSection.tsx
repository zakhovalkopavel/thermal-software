import { useState } from 'react';
import { Alert } from '@mui/material';
import { CalculatorPage, ResultPanel } from '../../../../components/calc';
import { useMetalList } from '../../hooks/useMetalList';
import { useSearchParamState } from '../../hooks/useSearchParamState';
import { toTemperatureGrid } from '../../mappers/temperature-grid.mapper';
import type { TemperatureSweep } from '../../types/temperature-sweep.type';
import { METALS_UI } from './constants/metals-ui.constants';
import { useMetalProperties } from './hooks/useMetalProperties';
import { MetalConditionsForm } from './MetalConditionsForm';
import { MetalResults } from './MetalResults';
import type { MetalPropertiesRequest } from './types/metal-properties-request.type';

export function MetalsSection() {
  const [materialParam, setMaterialParam] = useSearchParamState('material');
  const metals = useMetalList();
  const [grades, setGrades] = useState<Array<string | null>>([materialParam]);
  const [sweep, setSweep] = useState<TemperatureSweep>(METALS_UI.defaultSweep);
  const [request, setRequest] = useState<MetalPropertiesRequest | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const result = useMetalProperties(request);

  const catalog = metals.data ?? [];
  const unknownParam = Boolean(materialParam && metals.data && !catalog.some((m) => m.materialId === materialParam));

  const changeGrades = (next: Array<string | null>) => {
    setGrades(next);
    if (next[0] !== grades[0]) setMaterialParam(next[0]);
  };

  const calculate = () => {
    const materials = [...new Set(grades)].filter(
      (id): id is string => Boolean(id) && catalog.some((metal) => metal.materialId === id),
    );
    if (materials.length === 0) {
      setFormError('Select a metal grade.');
      return;
    }
    try {
      setRequest({ mode: sweep.mode, materials, temperatures_K: toTemperatureGrid(sweep) });
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <CalculatorPage
      title="Metals"
      description="Temperature-dependent thermal conductivity λ and emissivity ε of known metal grades."
      inputs={
        <>
          {unknownParam && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Unknown metal “{materialParam}” in the link — ignored.
            </Alert>
          )}
          <MetalConditionsForm
            metals={catalog}
            grades={grades}
            onGradesChange={changeGrades}
            sweep={sweep}
            onSweepChange={setSweep}
            onCalculate={calculate}
            loading={result.isLoading}
            formError={formError}
          />
        </>
      }
      results={
        <ResultPanel
          loading={result.isLoading}
          error={result.error ?? metals.error}
          hasResult={Boolean(request) && result.isComplete}
        >
          {request && <MetalResults request={request} metals={catalog} byMaterial={result.byMaterial} />}
        </ResultPanel>
      }
    />
  );
}
