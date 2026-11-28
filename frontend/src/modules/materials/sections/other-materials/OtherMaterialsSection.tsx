import { useEffect, useMemo, useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { CalculatorPage, ResultPanel } from '@/shared/ui/calc';
import { useSearchParamState } from '@/shared/hooks/useSearchParamState';
import { useCompoundGasBounds } from '../../hooks/useCompoundGasBounds';
import { useCompoundSearch } from '../../hooks/useCompoundSearch';
import { applyGasTemperatureBounds } from '../../mappers/apply-gas-temperature-bounds.mapper';
import { toTemperatureGrid } from '../../mappers/temperature-grid.mapper';
import type { CompoundSelection } from '../../types/compound-selection.type';
import type { TemperatureSweep } from '../../types/temperature-sweep.type';
import { usePureGasProperties } from '../gases/hooks/usePureGasProperties';
import { OTHER_MATERIALS_UI } from './constants/other-materials-ui.constants';
import { selectionFromCompoundParam } from './mappers/selection-from-compound-param.mapper';
import { OtherMaterialForm } from './OtherMaterialForm';
import { OtherMaterialIdentity } from './OtherMaterialIdentity';
import { OtherMaterialResults } from './OtherMaterialResults';
import type { OtherMaterialRequest } from './types/other-material-request.type';

export function OtherMaterialsSection() {
  const [compoundParam, setCompoundParam] = useSearchParamState(OTHER_MATERIALS_UI.param);
  const [selection, setSelection] = useState<CompoundSelection | null>(() => selectionFromCompoundParam(compoundParam));
  const [sweep, setSweep] = useState<TemperatureSweep>(OTHER_MATERIALS_UI.defaultSweep);
  const [pressure, setPressure] = useState<number | null>(OTHER_MATERIALS_UI.defaultPressure_Pa);
  const [request, setRequest] = useState<OtherMaterialRequest | null>(null);
  const [identityOnly, setIdentityOnly] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const compoundId = selection?.source === 'compound' ? selection.id : null;
  const needsEnrichment = Boolean(compoundId && selection?.source === 'compound' && !selection.formula);
  const enrich = useCompoundSearch(compoundId ?? '', false, needsEnrichment);
  const bounds = useCompoundGasBounds(compoundId, pressure);
  const gasResult = usePureGasProperties(
    request
      ? {
          mode: request.mode,
          gases: [request.compound],
          temperatures_K: request.temperatures_K,
          P_Pa: request.P_Pa,
        }
      : null,
  );

  useEffect(() => {
    const hit = enrich.data?.[0];
    if (!hit || !compoundId) return;
    const id = hit.compoundId ?? hit.id;
    if (id !== compoundId) return;
    setSelection({
      source: 'compound',
      id,
      label: hit.name,
      formula: hit.formula,
      displayFormula: hit.displayFormula,
      cas: hit.cas,
      className: hit.class,
      group: hit.group,
    });
  }, [compoundId, enrich.data]);

  useEffect(() => {
    if (!bounds.data) return;
    const nextBounds = bounds.data;
    setSweep((current) => {
      const next = applyGasTemperatureBounds(current, nextBounds);
      if (next.value === current.value && next.from === current.from && next.to === current.to) return current;
      return next;
    });
  }, [bounds.data?.Tmin_K, bounds.data?.Tmax_K, bounds.data?.P_Pa, compoundId]);

  const gasCapable = Boolean(bounds.data);
  const gasChecked = Boolean(compoundId) && !bounds.isFetching && (bounds.isFetched || bounds.isError);
  const boundsHint = useMemo(() => {
    if (!bounds.data?.boilingPoint_K) return null;
    const Tb = bounds.data.boilingPoint_K.toFixed(2);
    const source =
      bounds.data.boilingPointSource === 'vaporPressure'
        ? `Tb at ${(bounds.data.P_Pa / 1000).toFixed(1)} kPa`
        : 'normal Tb (≈1 atm)';
    const max = bounds.data.Tmax_K != null ? ` · correlations to ${bounds.data.Tmax_K.toFixed(0)} K` : '';
    return `Gas above ${Tb} K (${source})${max}${bounds.data.message ? ` — ${bounds.data.message}` : ''}`;
  }, [bounds.data]);

  const changeSelection = (next: CompoundSelection | null) => {
    setSelection(next);
    setRequest(null);
    setIdentityOnly(false);
    setFormError(null);
    const id = next?.source === 'compound' ? next.id : null;
    if (id !== compoundParam) setCompoundParam(id);
  };

  const calculate = () => {
    if (!selection || selection.source !== 'compound') {
      setFormError('Select a compound from the catalogue.');
      return;
    }
    if (!gasCapable) {
      if (!gasChecked) {
        setFormError('Checking gas-phase data for this compound…');
        return;
      }
      setRequest(null);
      setIdentityOnly(true);
      setFormError(null);
      return;
    }
    if (pressure === null) {
      setFormError('Enter pressure.');
      return;
    }
    try {
      setRequest({
        compound: { source: 'compound', id: selection.id, label: selection.label },
        temperatures_K: toTemperatureGrid(sweep),
        P_Pa: pressure,
        unit: sweep.unit,
        mode: sweep.mode,
      });
      setIdentityOnly(false);
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  const compoundSelection = selection?.source === 'compound' ? selection : null;
  const showIdentity = Boolean(compoundSelection && (identityOnly || request || selection));

  return (
    <CalculatorPage
      title="Other materials"
      description="Search the full compound catalogue — organic and inorganic, any phase. Gas properties are calculated when the record has gas thermo and transport."
      inputs={
        <OtherMaterialForm
          selection={selection}
          onSelectionChange={changeSelection}
          sweep={sweep}
          onSweepChange={setSweep}
          pressure_Pa={pressure}
          onPressureChange={setPressure}
          gasCapable={gasCapable}
          gasChecked={gasChecked}
          boundsHint={boundsHint}
          onCalculate={calculate}
          loading={gasResult.isLoading || bounds.isFetching}
          formError={formError}
        />
      }
      results={
        <ResultPanel
          loading={Boolean(request) && gasResult.isLoading}
          error={request ? gasResult.firstError : null}
          hasResult={Boolean(showIdentity)}
        >
          {compoundSelection && (
            <Stack spacing={2}>
              <OtherMaterialIdentity selection={compoundSelection} />
              {identityOnly && !request && (
                <Alert severity="info">Showing catalogue identity only — no gas-phase calculation for this compound.</Alert>
              )}
              {request && gasResult.isComplete && !gasResult.allFailed && (
                <OtherMaterialResults request={request} rows={gasResult.rows} />
              )}
              {request && gasResult.allFailed && (
                <Alert severity="warning">Gas property endpoints failed for this compound at the selected conditions.</Alert>
              )}
            </Stack>
          )}
        </ResultPanel>
      }
    />
  );
}
