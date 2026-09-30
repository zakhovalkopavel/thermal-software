import { useState } from 'react';
import { Box, Grid, Stack } from '@mui/material';
import { NumberField, ResultCard, ResultPanel, formatValue } from '../../../../../components/calc';
import { THERMAL_UI } from '../constants/thermal-ui.constants';
import { useTemperatureAtDepth } from '../hooks/useTemperatureAtDepth';
import type { ThermalPanelProps } from '../types/thermal-panel-props.type';

export function AtDepthPanel({ request }: ThermalPanelProps) {
  const [relDepth, setRelDepth] = useState<number | null>(THERMAL_UI.relDepth.default);
  const atDepth = useTemperatureAtDepth(request, relDepth);
  const data = atDepth.data;
  return (
    <Stack spacing={2}>
      <Box sx={{ maxWidth: 260 }}>
        <NumberField
          label="Relative coordinate ξ"
          value={relDepth}
          onChange={setRelDepth}
          min={THERMAL_UI.relDepth.min}
          max={THERMAL_UI.relDepth.max}
          helperText="0 = centre, 1 = surface"
        />
      </Box>
      <ResultPanel loading={atDepth.isLoading} error={atDepth.error} hasResult={Boolean(data)}>
        {data && (
          <Grid container spacing={1}>
            <Grid size={{ xs: 6, md: 4 }}>
              <ResultCard label={`T at ξ = ${formatValue(relDepth)}`} value={data.temperature} unit="°C" hint={`τ = ${request.tau} s`} />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <ResultCard label="Fourier Fo" value={data.criteria.Fo} />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <ResultCard label="Biot Bi" value={data.criteria.Bi ?? '—'} />
            </Grid>
          </Grid>
        )}
      </ResultPanel>
    </Stack>
  );
}
