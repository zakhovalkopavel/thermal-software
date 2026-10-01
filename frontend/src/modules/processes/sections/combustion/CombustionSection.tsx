import { useMemo, useState } from 'react';
import { Alert, Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { CalculateButton, CalculatorPage, ResultPanel } from '@/shared/ui/calc';
import { useFuels } from '../../hooks/useFuels';
import type { CombustionMode } from '../../types/combustion-mode.type';
import type { CombustionRequest } from '../../types/combustion-request.type';
import { CombustionResults } from './CombustionResults';
import { COMBUSTION_DEFAULTS } from './constants/combustion-defaults.constants';
import { COMBUSTION_MODES } from './constants/combustion-modes.constants';
import { COMBUSTION_UI } from './constants/combustion-ui.constants';
import { CombustionModeForm } from './forms/CombustionModeForm';
import { useCombustion } from './hooks/useCombustion';
import { toCombustionRequest } from './mappers/combustion-request.mapper';
import type { CombustionDrafts } from './types/combustion-drafts.type';

const isMode = (value: string | null): value is CombustionMode => COMBUSTION_MODES.some((item) => item.mode === value);

export function CombustionSection() {
  const [params, setParams] = useSearchParams();
  const requested = params.get(COMBUSTION_UI.modeParam);
  const mode: CombustionMode = isMode(requested) ? requested : COMBUSTION_MODES[0].mode;
  const setMode = (next: CombustionMode) =>
    setParams(
      (previous) => {
        previous.set(COMBUSTION_UI.modeParam, next);
        return previous;
      },
      { replace: true },
    );

  const fuels = useFuels();
  const [drafts, setDrafts] = useState<CombustionDrafts>(COMBUSTION_DEFAULTS);
  const [requests, setRequests] = useState<Partial<Record<CombustionMode, CombustionRequest>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const request = requests[mode] ?? null;
  const combustion = useCombustion(request);

  const fuelList = useMemo(() => fuels.data ?? [], [fuels.data]);
  const description = COMBUSTION_MODES.find((item) => item.mode === mode)?.description;

  const calculate = () => {
    try {
      const next = toCombustionRequest(mode, drafts, fuelList);
      setRequests((previous) => ({ ...previous, [mode]: next }));
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <CalculatorPage
      title="Combustion"
      description="Flame temperature, air and flue-gas flows and product composition for solid, gaseous, liquid and packed-bed combustion."
      inputsWidth={mode === 'bed' ? 'wide' : 'narrow'}
      inputs={
        <Stack
          component="form"
          spacing={2}
          onSubmit={(event) => {
            event.preventDefault();
            calculate();
          }}
        >
          <Tabs value={mode} onChange={(_, next: CombustionMode) => setMode(next)} variant="scrollable" scrollButtons="auto">
            {COMBUSTION_MODES.map((item) => (
              <Tab key={item.mode} value={item.mode} label={item.label} />
            ))}
          </Tabs>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
          {fuels.error && <Alert severity="warning">Fuel presets could not be loaded; enter a custom fuel.</Alert>}
          <CombustionModeForm mode={mode} drafts={drafts} onChange={setDrafts} fuels={fuelList} />
          {formError && <Alert severity="warning">{formError}</Alert>}
          <Box>
            <CalculateButton loading={combustion.isFetching} />
          </Box>
        </Stack>
      }
      results={
        <ResultPanel loading={combustion.isLoading} error={combustion.error} hasResult={Boolean(combustion.data && request)}>
          {combustion.data && request && <CombustionResults request={request} response={combustion.data} />}
        </ResultPanel>
      }
    />
  );
}
