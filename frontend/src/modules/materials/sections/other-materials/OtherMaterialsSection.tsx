import { useEffect, useMemo, useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { CalculatorPage, ResultPanel } from '@/shared/ui/calc';
import { useSearchParamState } from '@/shared/hooks/useSearchParamState';
import { useCompoundGasBounds } from '../../hooks/useCompoundGasBounds';
import { useCompoundLiquidBounds } from '../../hooks/useCompoundLiquidBounds';
import { useCompoundSearch } from '../../hooks/useCompoundSearch';
import { applyGasTemperatureBounds } from '../../mappers/apply-gas-temperature-bounds.mapper';
import { toTemperatureGrid } from '../../mappers/temperature-grid.mapper';
import type { CompoundSelection } from '../../types/compound-selection.type';
import type { FluidPhase } from '../../types/fluid-phase.type';
import type { TemperatureSweep } from '../../types/temperature-sweep.type';
import { usePureGasProperties } from '../gases/hooks/usePureGasProperties';
import { OTHER_MATERIALS_UI } from './constants/other-materials-ui.constants';
import { selectionFromCompoundParam } from './mappers/selection-from-compound-param.mapper';
import { OtherMaterialForm } from './OtherMaterialForm';
import { OtherMaterialIdentity } from './OtherMaterialIdentity';
import { OtherMaterialResults } from './OtherMaterialResults';
import type { OtherMaterialRequest } from './types/other-material-request.type';
import { SECTION_INFO_PATHS } from '@/modules/cms/constants/section-info-paths.constants';

export function OtherMaterialsSection() {
  const [compoundParam, setCompoundParam] = useSearchParamState(OTHER_MATERIALS_UI.param);
  const [selection, setSelection] = useState<CompoundSelection | null>(() => selectionFromCompoundParam(compoundParam));
  const [sweep, setSweep] = useState<TemperatureSweep>(OTHER_MATERIALS_UI.defaultSweep);
  const [pressure, setPressure] = useState<number | null>(OTHER_MATERIALS_UI.defaultPressure_Pa);
  const [phase, setPhase] = useState<FluidPhase>('gas');
  const [request, setRequest] = useState<OtherMaterialRequest | null>(null);
  const [identityOnly, setIdentityOnly] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const compoundId = selection?.source === 'compound' ? selection.id : null;
  const needsEnrichment = Boolean(compoundId && selection?.source === 'compound' && !selection.formula);
  const enrich = useCompoundSearch(compoundId ?? '', false, needsEnrichment);
  const gasBounds = useCompoundGasBounds(compoundId, pressure);
  const liquidBounds = useCompoundLiquidBounds(compoundId, pressure);
  const propsResult = usePureGasProperties(
    request
      ? {
          mode: request.mode,
          gases: [request.compound],
          temperatures_K: request.temperatures_K,
          P_Pa: request.P_Pa,
          phase: request.phase,
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

  const gasCapable = Boolean(gasBounds.data?.Tmin_K != null || gasBounds.data?.Tmax_K != null);
  const liquidCapable = Boolean(liquidBounds.data?.capable);
  const activeBounds = phase === 'liquid' ? liquidBounds.data : gasBounds.data;

  useEffect(() => {
    if (!activeBounds) return;
    const nextBounds = activeBounds;
    setSweep((current) => {
      const next = applyGasTemperatureBounds(current, nextBounds);
      if (next.value === current.value && next.from === current.from && next.to === current.to) return current;
      return next;
    });
  }, [
    activeBounds?.Tmin_K,
    activeBounds?.Tmax_K,
    activeBounds?.P_Pa,
    compoundId,
    phase,
  ]);

  useEffect(() => {
    if (!compoundId) return;
    if (liquidCapable && !gasCapable) setPhase('liquid');
    else if (gasCapable && !liquidCapable) setPhase('gas');
  }, [compoundId, gasCapable, liquidCapable]);

  const boundsChecked =
    Boolean(compoundId)
    && !gasBounds.isFetching
    && !liquidBounds.isFetching
    && (gasBounds.isFetched || gasBounds.isError)
    && (liquidBounds.isFetched || liquidBounds.isError);

  const boundsHint = useMemo(() => {
    if (!activeBounds) return null;
    if (phase === 'liquid') {
      const Tm = liquidBounds.data?.meltingPoint_K;
      const Tb = liquidBounds.data?.boilingPoint_K;
      const parts = [
        Tm != null ? `Tm ${Tm.toFixed(2)} K` : null,
        Tb != null ? `Tb ${Tb.toFixed(2)} K` : null,
        liquidBounds.data?.Tmax_K != null ? `correlations to ${liquidBounds.data.Tmax_K.toFixed(0)} K` : null,
      ].filter(Boolean);
      return parts.length ? `Liquid · ${parts.join(' · ')}` : null;
    }
    if (!gasBounds.data?.boilingPoint_K) return null;
    const Tb = gasBounds.data.boilingPoint_K.toFixed(2);
    const source =
      gasBounds.data.boilingPointSource === 'vaporPressure'
        ? `Tb at ${(gasBounds.data.P_Pa / 1000).toFixed(1)} kPa`
        : 'normal Tb (≈1 atm)';
    const max = gasBounds.data.Tmax_K != null ? ` · correlations to ${gasBounds.data.Tmax_K.toFixed(0)} K` : '';
    return `Gas above ${Tb} K (${source})${max}${gasBounds.data.message ? ` — ${gasBounds.data.message}` : ''}`;
  }, [activeBounds, gasBounds.data, liquidBounds.data, phase]);

  const changeSelection = (next: CompoundSelection | null) => {
    setSelection(next);
    setRequest(null);
    setIdentityOnly(false);
    setFormError(null);
    setPhase('gas');
    const id = next?.source === 'compound' ? next.id : null;
    if (id !== compoundParam) setCompoundParam(id);
  };

  const calculate = () => {
    if (!selection || selection.source !== 'compound') {
      setFormError('Select a compound from the catalogue.');
      return;
    }
    const canCalculate = gasCapable || liquidCapable;
    if (!canCalculate) {
      if (!boundsChecked) {
        setFormError('Checking phase data for this compound…');
        return;
      }
      setRequest(null);
      setIdentityOnly(true);
      setFormError(null);
      return;
    }
    const effectivePhase: FluidPhase = liquidCapable && !gasCapable ? 'liquid' : gasCapable && !liquidCapable ? 'gas' : phase;
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
        phase: effectivePhase,
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
      infoPath={SECTION_INFO_PATHS.otherMaterials}
      description="Search the full compound catalogue — organic and inorganic, any phase. Gas or liquid properties when the record has thermo and transport for that phase."
      inputs={
        <OtherMaterialForm
          selection={selection}
          onSelectionChange={changeSelection}
          sweep={sweep}
          onSweepChange={setSweep}
          pressure_Pa={pressure}
          onPressureChange={setPressure}
          phase={phase}
          onPhaseChange={setPhase}
          gasCapable={gasCapable}
          liquidCapable={liquidCapable}
          boundsChecked={boundsChecked}
          boundsHint={boundsHint}
          onCalculate={calculate}
          loading={propsResult.isLoading || gasBounds.isFetching || liquidBounds.isFetching}
          formError={formError}
        />
      }
      results={
        <ResultPanel
          loading={Boolean(request) && propsResult.isLoading}
          error={request ? propsResult.firstError : null}
          hasResult={Boolean(showIdentity)}
        >
          {compoundSelection && (
            <Stack spacing={2}>
              <OtherMaterialIdentity selection={compoundSelection} />
              {identityOnly && !request && (
                <Alert severity="info">
                  Showing catalogue identity only — no gas or liquid calculation for this compound.
                </Alert>
              )}
              {request && propsResult.isComplete && !propsResult.allFailed && (
                <OtherMaterialResults request={request} rows={propsResult.rows} />
              )}
              {request && propsResult.allFailed && (
                <Alert severity="warning">
                  Property endpoints failed for this compound at the selected conditions ({request.phase}).
                </Alert>
              )}
            </Stack>
          )}
        </ResultPanel>
      }
    />
  );
}
