import { Grid } from '@mui/material';
import { ResultCard, ResultPanel } from '../../../../../components/calc';
import { useThermalCriteria } from '../hooks/useThermalCriteria';
import type { ThermalPanelProps } from '../types/thermal-panel-props.type';

export function CriteriaPanel({ request }: ThermalPanelProps) {
  const criteria = useThermalCriteria(request);
  const data = criteria.data;
  return (
    <ResultPanel loading={criteria.isLoading} error={criteria.error} hasResult={Boolean(data)}>
      {data && (
        <Grid container spacing={1}>
          <Grid size={{ xs: 6, md: 3 }}>
            <ResultCard label="Biot Bi" value={data.Bi ?? '—'} hint={data.Bi === null ? 'Not defined for BC I' : undefined} />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <ResultCard label="Fourier Fo" value={data.Fo} />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <ResultCard label="Distribution length R_dist" value={data.Rdist} unit="m" />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <ResultCard label="Biot length R_Bi" value={data.Rbi} unit="m" />
          </Grid>
        </Grid>
      )}
    </ResultPanel>
  );
}
