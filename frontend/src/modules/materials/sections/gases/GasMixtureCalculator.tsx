import { useState } from 'react';
import { CalculatorPage, ResultPanel } from '../../../../components/calc';
import { useGasList } from '../../hooks/useGasList';
import { toTemperatureGrid } from '../../mappers/temperature-grid.mapper';
import type { TemperatureSweep } from '../../types/temperature-sweep.type';
import { GAS_MIXTURE_PRESETS } from './constants/gas-mixture-presets.constants';
import { GASES_UI } from './constants/gases-ui.constants';
import { GasMixtureForm } from './GasMixtureForm';
import { GasMixtureResults } from './GasMixtureResults';
import { useGasMixtureProperties } from './hooks/useGasMixtureProperties';
import type { GasMixtureRequest } from './types/gas-mixture-request.type';

export function GasMixtureCalculator() {
  const gasList = useGasList();
  const [composition, setComposition] = useState<Record<string, number>>({ ...GAS_MIXTURE_PRESETS[1].composition });
  const [fractionType, setFractionType] = useState<'mole' | 'mass'>('mole');
  const [sweep, setSweep] = useState<TemperatureSweep>({ ...GASES_UI.defaultSweep, mode: 'single', value: 1200 });
  const [pressure, setPressure] = useState<number | null>(GASES_UI.defaultPressure_atm);
  const [request, setRequest] = useState<GasMixtureRequest | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const result = useGasMixtureProperties(request);

  const species = (gasList.data ?? []).filter((gas) => gas.formula !== null).map((gas) => gas.key);

  const calculate = () => {
    if (!pressure || pressure <= 0) return setFormError('Enter a positive pressure.');
    const nonZero = Object.fromEntries(Object.entries(composition).filter(([, value]) => value > 0));
    try {
      setRequest({
        mode: sweep.mode,
        composition: nonZero,
        fractionType,
        temperatures_K: toTemperatureGrid(sweep),
        P_atm: pressure,
      });
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <CalculatorPage
      title="Gas mixture"
      description="Cp, H, ρ, μ, λ, Pr and diffusion coefficients of a gas mixture versus temperature."
      inputs={
        <GasMixtureForm
          species={species}
          composition={composition}
          onCompositionChange={setComposition}
          fractionType={fractionType}
          onFractionTypeChange={setFractionType}
          sweep={sweep}
          onSweepChange={setSweep}
          pressure_atm={pressure}
          onPressureChange={setPressure}
          onCalculate={calculate}
          loading={result.isLoading}
          formError={formError}
        />
      }
      results={
        <ResultPanel
          loading={result.isLoading}
          error={result.error ?? gasList.error}
          hasResult={Boolean(request) && result.isComplete}
        >
          {request && <GasMixtureResults request={request} rows={result.rows} />}
        </ResultPanel>
      }
    />
  );
}
