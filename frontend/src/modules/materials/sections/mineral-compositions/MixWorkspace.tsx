import type { ReactNode } from 'react';
import { Alert, Box, Grid, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useSearchParamsPatch } from '../../hooks/useSearchParamsPatch';
import { BlendOptimizerTab } from './analyses/BlendOptimizerTab';
import { ChemicalTab } from './analyses/ChemicalTab';
import { GranulometryTab } from './analyses/GranulometryTab';
import { PackingTab } from './analyses/PackingTab';
import { WaterShrinkageTab } from './analyses/WaterShrinkageTab';
import { MixStructureChart } from './charts/MixStructureChart';
import { MIX_TABS } from './constants/mix-tabs.constants';
import { useMix } from './hooks/useMix';
import { BulkCompositionCard } from './mix/BulkCompositionCard';
import { FractionTable } from './mix/FractionTable';
import type { MixTabKey } from './types/mix-tab-key.type';

const TAB_PARAM = 'tab';

const isMixTabKey = (value: string | null): value is MixTabKey => MIX_TABS.some((tab) => tab.key === value);

export function MixWorkspace() {
  const { ready } = useMix();
  const [params, patchParams] = useSearchParamsPatch();
  const requested = params.get(TAB_PARAM);
  const tab: MixTabKey = isMixTabKey(requested) ? requested : MIX_TABS[0].key;

  const panels: Record<MixTabKey, ReactNode> = {
    chemical: <ChemicalTab />,
    granulometry: <GranulometryTab active={tab === 'granulometry'} />,
    packing: <PackingTab active={tab === 'packing'} />,
    water: <WaterShrinkageTab active={tab === 'water'} />,
    blend: <BlendOptimizerTab />,
  };

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1">Mix</Typography>
          <FractionTable />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <MixStructureChart />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <BulkCompositionCard />
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Paper variant="outlined">
        <Tabs value={tab} onChange={(_, next: MixTabKey) => patchParams({ [TAB_PARAM]: next })} variant="scrollable" scrollButtons="auto">
          {MIX_TABS.map((item) => (
            <Tab key={item.key} value={item.key} label={item.label} />
          ))}
        </Tabs>
        <Box sx={{ p: 2 }}>
          {!ready && (
            <Alert severity="info">
              Complete the mix first: every row needs a material, a size fraction, mass % &gt; 0 and a density, and the mass % must add up to 100.
            </Alert>
          )}
          {MIX_TABS.map((item) => (
            <Box key={item.key} hidden={!ready || item.key !== tab}>
              {panels[item.key]}
            </Box>
          ))}
        </Box>
      </Paper>
    </Stack>
  );
}
