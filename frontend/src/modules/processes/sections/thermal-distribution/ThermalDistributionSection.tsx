import { useState } from 'react';
import { Box, Stack, Tab, Tabs } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { CalculatorPage, ResultPanel } from '../../../../components/calc';
import { ThermalInputsForm } from './ThermalInputsForm';
import { THERMAL_DEFAULTS } from './constants/thermal-defaults.constants';
import { THERMAL_OPTIONS } from './constants/thermal-options.constants';
import { THERMAL_UI } from './constants/thermal-ui.constants';
import { useThermalCriteria } from './hooks/useThermalCriteria';
import { toThermalRequest } from './mappers/thermal-request.mapper';
import { AtDepthPanel } from './panels/AtDepthPanel';
import { AveragePanel } from './panels/AveragePanel';
import { CriteriaPanel } from './panels/CriteriaPanel';
import { ProfilePanel } from './panels/ProfilePanel';
import type { ThermalDraft } from './types/thermal-draft.type';
import type { ThermalRequest } from './types/thermal-request.type';
import type { ThermalTabKey } from './types/thermal-tab-key.type';

const isTab = (value: string | null): value is ThermalTabKey => THERMAL_OPTIONS.tabs.some((tab) => tab.value === value);

export function ThermalDistributionSection() {
  const [params, setParams] = useSearchParams();
  const requested = params.get(THERMAL_UI.tabParam);
  const tab: ThermalTabKey = isTab(requested) ? requested : THERMAL_OPTIONS.tabs[0].value;
  const setTab = (next: ThermalTabKey) =>
    setParams(
      (previous) => {
        previous.set(THERMAL_UI.tabParam, next);
        return previous;
      },
      { replace: true },
    );

  const [draft, setDraft] = useState<ThermalDraft>(THERMAL_DEFAULTS);
  const [request, setRequest] = useState<ThermalRequest | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const criteria = useThermalCriteria(request);

  const calculate = () => {
    try {
      setRequest(toThermalRequest(draft));
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <CalculatorPage
      title="Thermal distribution"
      description="Transient conduction in a body heated or quenched by a medium: Biot / Fourier criteria, T(ξ, τ) and the volume-average temperature."
      inputs={<ThermalInputsForm draft={draft} onChange={setDraft} onSubmit={calculate} loading={criteria.isFetching} error={formError} />}
      results={
        request ? (
          <Stack spacing={2}>
            <Tabs value={tab} onChange={(_, next: ThermalTabKey) => setTab(next)} variant="scrollable" scrollButtons="auto">
              {THERMAL_OPTIONS.tabs.map((item) => (
                <Tab key={item.value} value={item.value} label={item.label} />
              ))}
            </Tabs>
            <Box hidden={tab !== 'criteria'}>
              <CriteriaPanel request={request} />
            </Box>
            <Box hidden={tab !== 'at-depth'}>
              <AtDepthPanel request={request} />
            </Box>
            <Box hidden={tab !== 'profile'}>
              <ProfilePanel request={request} />
            </Box>
            <Box hidden={tab !== 'average'}>
              <AveragePanel request={request} />
            </Box>
          </Stack>
        ) : (
          <ResultPanel hasResult={false} />
        )
      }
    />
  );
}
