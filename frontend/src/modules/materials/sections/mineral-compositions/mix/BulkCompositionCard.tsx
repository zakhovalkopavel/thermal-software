import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { JsonErrorAlert, OxideCompositionInput, REFRACTORY_OXIDES, formatValue } from '@/shared/ui/calc';
import type { CompositionUnit } from '@/shared/ui/calc';
import { compositionApi } from '@/shared/api/composition.api';
import { MATERIALS_QUERY_KEYS } from '../../../constants/materials-query-keys.constants';
import { BulkCompositionPieChart } from '../charts/BulkCompositionPieChart';
import { useMix } from '../hooks/useMix';
import { useMixComposition } from '../hooks/useMixComposition';

const noop = () => undefined;

export function BulkCompositionCard() {
  const { completeFractions } = useMix();
  const composition = useMixComposition(completeFractions);
  const [unit, setUnit] = useState<CompositionUnit>('wt');
  const normalized = (composition.data?.acceptedOxides_normalized ?? {}) as Record<string, number>;
  const mol = useQuery({
    queryKey: MATERIALS_QUERY_KEYS.compositionConvert(normalized, 'wt_to_mol'),
    queryFn: () => compositionApi.convert(normalized, 'wt_to_mol'),
    enabled: unit === 'mol' && Object.keys(normalized).length > 0,
    staleTime: Infinity,
    retry: false,
  });

  if (completeFractions.length === 0) {
    return <Typography color="text.secondary">Complete at least one fraction to see the mix composition.</Typography>;
  }
  if (!composition.data) {
    return composition.isLoading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    ) : (
      <JsonErrorAlert error={composition.error} />
    );
  }

  const result = composition.data;
  const coverage = Object.values(result.acceptedOxides_wt).reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const nonOxide = Object.entries(result.nonOxideComponents_wt).filter(([, value]) => (value ?? 0) > 0);
  const otherOxides = Object.entries(result.otherOxides_wt).filter(([, value]) => value > 0);
  const shown = unit === 'wt' ? normalized : (mol.data?.output ?? {});

  return (
    <Stack spacing={1.5}>
      {composition.error ? <JsonErrorAlert error={composition.error} /> : null}
      {result.warnings.map((warning) => (
        <Alert key={warning} severity="warning">
          {warning}
        </Alert>
      ))}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                Accepted oxides, normalised (used by the chemical analyses)
              </Typography>
              <ToggleButtonGroup size="small" exclusive value={unit} onChange={(_, next: CompositionUnit | null) => next && setUnit(next)}>
                <ToggleButton value="wt">wt%</ToggleButton>
                <ToggleButton value="mol">mol%</ToggleButton>
              </ToggleButtonGroup>
              {mol.isFetching && <CircularProgress size={16} />}
            </Stack>
            {mol.error ? <JsonErrorAlert error={mol.error} /> : null}
            <OxideCompositionInput value={shown} onChange={noop} unit={unit} allowedOxides={REFRACTORY_OXIDES} readOnly />
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Coverage by accepted oxides</TableCell>
                  <TableCell align="right">{formatValue(coverage)} % of fired mass</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Loss on ignition</TableCell>
                  <TableCell align="right">{formatValue(result.lossOnIgnition_wt)} wt% of raw mix</TableCell>
                </TableRow>
                {otherOxides.map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell>Other oxide {key}</TableCell>
                    <TableCell align="right">{formatValue(value)} wt%</TableCell>
                  </TableRow>
                ))}
                {nonOxide.map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell>Non-oxide: {key}</TableCell>
                    <TableCell align="right">{formatValue(value)} wt%</TableCell>
                  </TableRow>
                ))}
                {result.droppedMetals_wt > 0 && (
                  <TableRow>
                    <TableCell>Dropped metal impurities</TableCell>
                    <TableCell align="right">{formatValue(result.droppedMetals_wt)} wt%</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell>True density (fired)</TableCell>
                  <TableCell align="right">{formatValue(result.trueDensity_kgm3)} kg/m³</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <BulkCompositionPieChart result={result} />
        </Grid>
      </Grid>
    </Stack>
  );
}
