import { useState } from 'react';
import { Box, Grid, Slider, Stack, Typography } from '@mui/material';
import { NumberField, ResultTable, formatValue } from '../../../../../components/calc';
import type { ResultTableColumn } from '../../../../../components/calc';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { CumulativePsdChart } from '../charts/CumulativePsdChart';
import { FractionMassesChart } from '../charts/FractionMassesChart';
import { ParticipationChart } from '../charts/ParticipationChart';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import { useGranulometry } from '../hooks/useGranulometry';
import { useMix } from '../hooks/useMix';
import { toFractionLabel } from '../mappers/fraction-label.mapper';
import type { MixTabProps } from '../types/mix-tab-props.type';
import { AnalysisCard } from './AnalysisCard';

const PSD = MINERAL_COMPOSITIONS_UI.psd;

type Row = { id: string; label: string; actual: number; andreasen?: number; funkDinger?: number; fixed: boolean };

const COLUMNS: ResultTableColumn<Row>[] = [
  { key: 'label', label: 'Fraction', align: 'left', render: (row) => `${row.label}${row.fixed ? ' (fixed)' : ''}` },
  { key: 'actual', label: 'Actual', unit: '%' },
  { key: 'andreasen', label: 'Andreasen', unit: '%' },
  { key: 'funkDinger', label: 'Funk–Dinger', unit: '%' },
];

export function GranulometryTab({ active }: MixTabProps) {
  const { completeFractions, components, ready } = useMix();
  const [q, setQ] = useState<number>(PSD.defaultQ);
  const [dmin, setDmin] = useState<number | null>(null);
  const debouncedQ = useDebouncedValue(q, PSD.debounce_ms);
  const { andreasen, funkDinger, participation } = useGranulometry(completeFractions, active && ready, debouncedQ, dmin);

  const labels = completeFractions.map((fraction) => toFractionLabel(fraction, components));
  const rows: Row[] = completeFractions.map((fraction, index) => ({
    id: fraction.id,
    label: labels[index],
    actual: fraction.massPercent,
    andreasen: andreasen.data?.massFractionsRoundedPercent[index],
    funkDinger: funkDinger.data?.massFractionsRoundedPercent[index],
    fixed: fraction.isFixed,
  }));

  return (
    <Stack spacing={2}>
      <Grid container spacing={2} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="body2">Distribution modulus q = {formatValue(q)}</Typography>
          <Slider value={q} onChange={(_, value) => setQ(value as number)} min={PSD.qMin} max={PSD.qMax} step={PSD.qStep} valueLabelDisplay="auto" />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <NumberField label="Funk–Dinger Dmin" unit="mm" value={dmin} onChange={setDmin} min={0} helperText="Empty = backend default" />
        </Grid>
      </Grid>
      <AnalysisCard
        title="Particle size distribution"
        loading={andreasen.isLoading || funkDinger.isLoading}
        error={andreasen.error ?? funkDinger.error}
        hasResult={Boolean(andreasen.data || funkDinger.data)}
      >
        <Stack spacing={2}>
          <CumulativePsdChart fractions={completeFractions} labels={labels} andreasen={andreasen.data} funkDinger={funkDinger.data} />
          <FractionMassesChart fractions={completeFractions} labels={labels} andreasen={andreasen.data} funkDinger={funkDinger.data} />
          <ResultTable columns={COLUMNS} rows={rows} rowKey={(row) => row.id} />
        </Stack>
      </AnalysisCard>
      <AnalysisCard title="Participation" loading={participation.isLoading} error={participation.error} hasResult={Boolean(participation.data)}>
        {participation.data && (
          <Box>
            <ParticipationChart labels={labels} result={participation.data} />
          </Box>
        )}
      </AnalysisCard>
    </Stack>
  );
}
