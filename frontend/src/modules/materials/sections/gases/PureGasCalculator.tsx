import { useEffect, useMemo, useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { SECTION_INFO_PATHS } from '@/modules/cms/constants/section-info-paths.constants';
import { CalculatorPage, ResultPanel } from '@/shared/ui/calc';
import { useGasList } from '../../hooks/useGasList';
import { useCompoundGasBounds } from '../../hooks/useCompoundGasBounds';
import { useSearchParamState } from '@/shared/hooks/useSearchParamState';
import { applyGasTemperatureBounds } from '../../mappers/apply-gas-temperature-bounds.mapper';
import { boundsIdFromSelection } from '../../mappers/bounds-id-from-selection.mapper';
import { toTemperatureGrid } from '../../mappers/temperature-grid.mapper';
import type { CompoundSelection } from '../../types/compound-selection.type';
import type { TemperatureSweep } from '../../types/temperature-sweep.type';
import { CpComparisonPanel } from './CpComparisonPanel';
import { GASES_UI } from './constants/gases-ui.constants';
import { usePureGasProperties } from './hooks/usePureGasProperties';
import { PureGasForm } from './PureGasForm';
import { PureGasResults } from './PureGasResults';
import type { PureGasRequest } from './types/pure-gas-request.type';

function selectionFromParam(key: string | null, listReady: boolean): CompoundSelection | null {
  if (!key) return null;
  if (!listReady) return { source: 'registry', key, label: key, formula: null };
  return { source: 'registry', key, label: key, formula: null };
}

export function PureGasCalculator() {
  const [gasParam, setGasParam] = useSearchParamState('gas');
  const gasList = useGasList();
  const [gases, setGases] = useState<Array<CompoundSelection | null>>([selectionFromParam(gasParam, Boolean(gasList.data))]);
  const [sweep, setSweep] = useState<TemperatureSweep>(GASES_UI.defaultSweep);
  const [pressure, setPressure] = useState<number | null>(GASES_UI.defaultPressure_Pa);
  const [request, setRequest] = useState<PureGasRequest | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const result = usePureGasProperties(request);

  const list = gasList.data ?? [];
  const primary = gases[0];
  const boundsId = primary ? boundsIdFromSelection(primary) : null;
  const bounds = useCompoundGasBounds(boundsId, pressure);

  useEffect(() => {
    if (!bounds.data) return;
    const nextBounds = bounds.data;
    setSweep((current) => {
      const next = applyGasTemperatureBounds(current, nextBounds);
      if (next.value === current.value && next.from === current.from && next.to === current.to) return current;
      return next;
    });
  }, [bounds.data?.Tmin_K, bounds.data?.Tmax_K, bounds.data?.P_Pa, boundsId]);

  const boundsHint = useMemo(() => {
    if (!bounds.data?.boilingPoint_K) return null;
    const Tb = bounds.data.boilingPoint_K.toFixed(2);
    const source =
      bounds.data.boilingPointSource === 'vaporPressure'
        ? `Tb at ${(bounds.data.P_Pa / 1000).toFixed(1)} kPa`
        : 'normal Tb (≈1 atm)';
    const max =
      bounds.data.Tmax_K != null ? ` · correlations to ${bounds.data.Tmax_K.toFixed(0)} K` : '';
    return `Gas above ${Tb} K (${source})${max}${bounds.data.message ? ` — ${bounds.data.message}` : ''}`;
  }, [bounds.data]);

  const selectableRegistry = new Set(
    list.filter((gas) => !(GASES_UI.excludedPickerIds as readonly string[]).includes(gas.key)).map((gas) => gas.key),
  );
  const unknownParam = Boolean(gasParam && gasList.data && !selectableRegistry.has(gasParam));
  const speciesForCp = gases
    .filter((gas): gas is Extract<CompoundSelection, { source: 'registry' }> => gas?.source === 'registry')
    .map((gas) => gas.key)
    .filter((key) => list.some((gas) => gas.key === key && gas.formula !== null));

  const changeGases = (next: Array<CompoundSelection | null>) => {
    setGases(next);
    const first = next[0];
    const key = first?.source === 'registry' ? first.key : null;
    if (key !== gasParam) setGasParam(key);
  };

  const calculate = () => {
    const chosen = gases.filter((gas): gas is CompoundSelection => Boolean(gas));
    if (chosen.length === 0) return setFormError('Select a gas.');
    if (!pressure || pressure <= 0) return setFormError('Enter a positive pressure.');
    if (bounds.data?.Tmin_K != null) {
      try {
        const temps = toTemperatureGrid(sweep);
        if (temps.some((T) => T < bounds.data!.Tmin_K! - 1e-6)) {
          return setFormError(
            `Temperatures must be at or above the boiling point (${bounds.data.Tmin_K.toFixed(2)} K) at the selected pressure.`,
          );
        }
      } catch {
        // temperature grid validation below
      }
    }
    try {
      setRequest({
        mode: sweep.mode,
        gases: chosen.map((gas) =>
          gas.source === 'registry'
            ? { source: 'registry', key: gas.key, label: gas.label }
            : { source: 'compound', id: gas.id, label: gas.label },
        ),
        temperatures_K: toTemperatureGrid(sweep),
        P_Pa: pressure,
      });
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <CalculatorPage
      title="Pure gas"
      infoPath={SECTION_INFO_PATHS.gasesPure}
      description="Cp, Cv, γ, M, μ, ν, ρ, λ and Pr of pure gases versus temperature (plot any available property)."
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
            boundsHint={boundsHint}
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
          {request && (
            <PureGasResults
              request={request}
              rows={result.rows}
              gasList={list}
              temperatureUnit={sweep.unit}
            />
          )}
        </ResultPanel>
      }
    />
  );
}
