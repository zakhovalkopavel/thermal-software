import { useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { CalculatorPage, ResultPanel } from '@/shared/ui/calc';
import { useGasList } from '../../hooks/useGasList';
import { useSearchParamState } from '@/shared/hooks/useSearchParamState';
import { toTemperatureGrid } from '../../mappers/temperature-grid.mapper';
import type { TemperatureSweep } from '../../types/temperature-sweep.type';
import { CpComparisonPanel } from './CpComparisonPanel';
import { GASES_UI } from './constants/gases-ui.constants';
import { usePureGasProperties } from './hooks/usePureGasProperties';
import { PureGasForm } from './PureGasForm';
import { PureGasResults } from './PureGasResults';
import type { PureGasRequest } from './types/pure-gas-request.type';

export function PureGasCalculator() {
  const [gasParam, setGasParam] = useSearchParamState('gas');
  const gasList = useGasList();
  const [gases, setGases] = useState<Array<string | null>>([gasParam]);
  const [sweep, setSweep] = useState<TemperatureSweep>(GASES_UI.defaultSweep);
  const [pressure, setPressure] = useState<number | null>(GASES_UI.defaultPressure_Pa);
  const [request, setRequest] = useState<PureGasRequest | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const result = usePureGasProperties(request);

  const list = gasList.data ?? [];
  const selectable = list.filter((gas) => !(GASES_UI.excludedPickerIds as readonly string[]).includes(gas.key));
  const unknownParam = Boolean(gasParam && gasList.data && !selectable.some((gas) => gas.key === gasParam));
  const speciesForCp = gases.filter(
    (key): key is string => Boolean(key) && list.some((gas) => gas.key === key && gas.formula !== null),
  );

  const changeGases = (next: Array<string | null>) => {
    setGases(next);
    if (next[0] !== gases[0]) setGasParam(next[0]);
  };

  const calculate = () => {
    const chosen = [...new Set(gases)].filter(
      (key): key is string => Boolean(key) && selectable.some((gas) => gas.key === key),
    );
    if (chosen.length === 0) return setFormError('Select a gas.');
    if (!pressure || pressure <= 0) return setFormError('Enter a positive pressure.');
    try {
      setRequest({ mode: sweep.mode, gases: chosen, temperatures_K: toTemperatureGrid(sweep), P_Pa: pressure });
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <CalculatorPage
      title="Pure gas"
      description="Cp, Cv, γ, M, μ, ν, ρ, λ and Pr of pure gases versus temperature."
      inputs={
        <Stack spacing={2}>
          {unknownParam && <Alert severity="info">Unknown gas “{gasParam}” in the link — ignored.</Alert>}
          <PureGasForm
            gases={gases}
            onGasesChange={changeGases}
            sweep={sweep}
            onSweepChange={setSweep}
            pressure_Pa={pressure}
            onPressureChange={setPressure}
            onCalculate={calculate}
            loading={result.isLoading}
            formError={formError}
          />
          <CpComparisonPanel species={speciesForCp} />
        </Stack>
      }
      results={
        <ResultPanel
          loading={result.isLoading}
          error={result.allFailed ? result.firstError : gasList.error}
          hasResult={Boolean(request) && result.isComplete && !result.allFailed}
        >
          {request && <PureGasResults request={request} rows={result.rows} gasList={list} />}
        </ResultPanel>
      }
    />
  );
}
