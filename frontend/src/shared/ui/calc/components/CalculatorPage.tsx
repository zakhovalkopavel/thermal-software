import type { ReactNode } from 'react';
import { Box, Grid, Paper, Stack, Typography } from '@mui/material';

type CalculatorPageProps = {
  title: ReactNode;
  description?: ReactNode;
  inputs: ReactNode;
  results: ReactNode;
  inputsWidth?: 'narrow' | 'wide';
};

export function CalculatorPage({ title, description, inputs, results, inputsWidth = 'narrow' }: CalculatorPageProps) {
  const inputSize = inputsWidth === 'wide' ? { xs: 12, lg: 6 } : { xs: 12, md: 5, lg: 4 };
  const resultSize = inputsWidth === 'wide' ? { xs: 12, lg: 6 } : { xs: 12, md: 7, lg: 8 };
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5">{title}</Typography>
        {description && <Typography color="text.secondary">{description}</Typography>}
      </Box>
      <Grid container spacing={3} alignItems="flex-start">
        <Grid size={inputSize}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            {inputs}
          </Paper>
        </Grid>
        <Grid size={resultSize}>{results}</Grid>
      </Grid>
    </Stack>
  );
}
