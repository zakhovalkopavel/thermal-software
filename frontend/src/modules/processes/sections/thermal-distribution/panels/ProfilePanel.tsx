import { useState } from 'react';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { ResultPanel } from '../../../../../components/calc';
import { TemperatureProfileChart } from '../charts/TemperatureProfileChart';
import { THERMAL_UI } from '../constants/thermal-ui.constants';
import { useTemperatureProfiles } from '../hooks/useTemperatureProfiles';
import { toRelativeDepthGrid } from '../mappers/relative-depth-grid.mapper';
import { parseTauList } from '../mappers/tau-list.mapper';
import type { ThermalPanelProps } from '../types/thermal-panel-props.type';

const DEPTHS = toRelativeDepthGrid(THERMAL_UI.profilePoints);
const DEFAULT_TAUS = parseTauList(THERMAL_UI.defaultTauList);

export function ProfilePanel({ request }: ThermalPanelProps) {
  const [tauText, setTauText] = useState<string>(THERMAL_UI.defaultTauList);
  const [taus, setTaus] = useState<number[]>(DEFAULT_TAUS);
  const [tauError, setTauError] = useState<string | null>(null);
  const current = useTemperatureProfiles(request, [request.tau], DEPTHS);
  const overTime = useTemperatureProfiles(request, taus, DEPTHS);

  const applyTaus = () => {
    try {
      setTaus(parseTauList(tauText));
      setTauError(null);
    } catch (error) {
      setTauError((error as Error).message);
    }
  };

  return (
    <Stack spacing={2}>
      <ResultPanel loading={current.loading} error={current.error} hasResult={!current.loading && !current.error}>
        <TemperatureProfileChart title={`Temperature profile at τ = ${request.tau} s`} request={request} depths={DEPTHS} profiles={current.profiles} />
      </ResultPanel>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <TextField
          size="small"
          fullWidth
          label="Times τ for the profiles over time"
          value={tauText}
          onChange={(event) => setTauText(event.target.value)}
          helperText={`Seconds, comma-separated, up to ${THERMAL_UI.maxTauListLength}`}
        />
        <Button variant="outlined" onClick={applyTaus} sx={{ flexShrink: 0 }}>
          Apply
        </Button>
      </Stack>
      {tauError && <Alert severity="warning">{tauError}</Alert>}
      <ResultPanel loading={overTime.loading} error={overTime.error} hasResult={!overTime.loading && !overTime.error}>
        <TemperatureProfileChart title="Profiles over time" request={request} depths={DEPTHS} profiles={overTime.profiles} />
      </ResultPanel>
    </Stack>
  );
}
