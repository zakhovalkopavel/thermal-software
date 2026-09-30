import { Box, Stack, Tab, Tabs } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { BodyGeometryCalculator } from './BodyGeometryCalculator';
import { HtcCalculator } from './HtcCalculator';
import { HTC_TABS } from './constants/htc-tabs.constants';
import { HTC_UI } from './constants/htc-ui.constants';
import type { HtcTabKey } from './types/htc-tab-key.type';

const isTab = (value: string | null): value is HtcTabKey => HTC_TABS.some((tab) => tab.value === value);

export function HtcSection() {
  const [params, setParams] = useSearchParams();
  const requested = params.get(HTC_UI.tabParam);
  const tab: HtcTabKey = isTab(requested) ? requested : HTC_TABS[0].value;
  const setTab = (next: HtcTabKey) =>
    setParams(
      (previous) => {
        previous.set(HTC_UI.tabParam, next);
        return previous;
      },
      { replace: true },
    );

  return (
    <Stack spacing={2}>
      <Tabs value={tab} onChange={(_, next: HtcTabKey) => setTab(next)}>
        {HTC_TABS.map((item) => (
          <Tab key={item.value} value={item.value} label={item.label} />
        ))}
      </Tabs>
      <Box hidden={tab !== 'htc'}>
        <HtcCalculator />
      </Box>
      <Box hidden={tab !== 'body'}>
        <BodyGeometryCalculator />
      </Box>
    </Stack>
  );
}
