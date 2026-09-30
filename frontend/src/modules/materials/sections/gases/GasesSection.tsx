import { useState } from 'react';
import { Stack, Tab, Tabs } from '@mui/material';
import { GasMixtureCalculator } from './GasMixtureCalculator';
import { PureGasCalculator } from './PureGasCalculator';

type GasesTab = 'pure' | 'mixture';

export function GasesSection() {
  const [tab, setTab] = useState<GasesTab>('pure');
  return (
    <Stack spacing={2}>
      <Tabs value={tab} onChange={(_, next: GasesTab) => setTab(next)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="pure" label="Pure gas" />
        <Tab value="mixture" label="Gas mixture" />
      </Tabs>
      <div hidden={tab !== 'pure'}>
        <PureGasCalculator />
      </div>
      <div hidden={tab !== 'mixture'}>
        <GasMixtureCalculator />
      </div>
    </Stack>
  );
}
