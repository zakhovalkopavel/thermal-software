import { useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { EnumSelect, JsonErrorAlert, NumberField } from '@/shared/ui/calc';
import { CpComparisonChart } from './charts/CpComparisonChart';
import { GASES_UI } from './constants/gases-ui.constants';
import { useCpComparison } from './hooks/useCpComparison';
import type { CpComparisonPanelProps } from './types/cp-comparison-panel-props.type';

export function CpComparisonPanel({ species }: CpComparisonPanelProps) {
  const [selected, setSelected] = useState<string>('');
  const [T_K, setT_K] = useState<number | null>(GASES_UI.cpComparisonDefault_K);
  const [request, setRequest] = useState<{ species: string; T_K: number } | null>(null);
  const comparison = useCpComparison(request);

  const current = species.includes(selected) ? selected : (species[0] ?? '');

  return (
    <Accordion variant="outlined" disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">Advanced: Cp methods comparison</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {species.length === 0 ? (
          <Alert severity="info">Select a gas species above. The comparison is not available for aliases such as air.</Alert>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1}>
              <EnumSelect
                label="Species"
                value={current}
                options={species.map((key) => ({ value: key, label: key }))}
                onChange={setSelected}
              />
              <NumberField label="T" unit="K" value={T_K} min={1} onChange={setT_K} />
            </Stack>
            <Button
              variant="outlined"
              disabled={!current || !T_K || comparison.isFetching}
              onClick={() => T_K && setRequest({ species: current, T_K })}
            >
              Compare
            </Button>
            {comparison.error ? <JsonErrorAlert error={comparison.error} /> : null}
            {request && comparison.data && (
              <CpComparisonChart species={request.species} T_K={request.T_K} entries={comparison.data} />
            )}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
