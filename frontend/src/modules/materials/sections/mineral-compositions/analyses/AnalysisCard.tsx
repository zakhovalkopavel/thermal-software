import { Paper, Stack, Typography } from '@mui/material';
import { ResultPanel } from '../../../../../components/calc';
import type { AnalysisCardProps } from '../types/analysis-card-props.type';

export function AnalysisCard({ title, loading, error, hasResult, idleText, children }: AnalysisCardProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Stack spacing={1}>
        <Typography variant="subtitle1">{title}</Typography>
        <ResultPanel loading={loading} error={error} hasResult={hasResult} idleText={idleText}>
          {children}
        </ResultPanel>
      </Stack>
    </Paper>
  );
}
