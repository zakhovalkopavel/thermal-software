import type { ReactNode } from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { JsonErrorAlert } from './JsonErrorAlert';

type ResultPanelProps = {
  loading?: boolean;
  error?: unknown;
  hasResult: boolean;
  idleText?: string;
  children?: ReactNode;
};

export function ResultPanel({
  loading,
  error,
  hasResult,
  idleText = 'Set the conditions and press Calculate.',
  children,
}: ResultPanelProps) {
  return (
    <Stack spacing={2}>
      {error ? <JsonErrorAlert error={error} /> : null}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {!loading && !error && !hasResult && (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {idleText}
        </Typography>
      )}
      {hasResult && children}
    </Stack>
  );
}
