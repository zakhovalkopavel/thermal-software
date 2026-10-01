import { useState } from 'react';
import { Alert, Box, Grid, Stack, TextField, Typography } from '@mui/material';
import { CalculateButton, EnumSelect, NumberField, ResultCard } from '@/shared/ui/calc';
import { ShrinkageChart } from '../charts/ShrinkageChart';
import { WaterRangeChart } from '../charts/WaterRangeChart';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import { MIX_OPTION_LABELS } from '../constants/mix-option-labels.constants';
import { useMix } from '../hooks/useMix';
import { useShrinkage } from '../hooks/useShrinkage';
import { useWaterDemand } from '../hooks/useWaterDemand';
import { parseTemperatureProfile } from '../mappers/temperature-profile.mapper';
import type { CementType } from '../types/cement-type.type';
import type { MixTabProps } from '../types/mix-tab-props.type';
import type { ShrinkageInput } from '../types/shrinkage-input.type';
import type { Workability } from '../types/workability.type';
import { AnalysisCard } from './AnalysisCard';

const WATER = MINERAL_COMPOSITIONS_UI.water;
const SHRINKAGE = MINERAL_COMPOSITIONS_UI.shrinkage;

const WORKABILITY_OPTIONS = (Object.entries(MIX_OPTION_LABELS.workability) as [Workability, string][]).map(([value, label]) => ({ value, label }));
const CEMENT_OPTIONS = (Object.entries(MIX_OPTION_LABELS.cementType) as [CementType, string][]).map(([value, label]) => ({ value, label }));

export function WaterShrinkageTab({ active }: MixTabProps) {
  const { state } = useMix();
  const [phiInput, setPhiInput] = useState<number | null>(null);
  const [workability, setWorkability] = useState<Workability>(WATER.defaultWorkability);
  const phi = phiInput ?? state.phi;
  const phiValid = phi !== null && phi > WATER.phiMin && phi <= WATER.phiMax;
  const { demand, range } = useWaterDemand(phiValid ? phi : null, workability, active);

  const [profile, setProfile] = useState<string>(SHRINKAGE.defaultProfile_C);
  const [waterCementRatio, setWaterCementRatio] = useState<number | null>(SHRINKAGE.defaultWaterCementRatio);
  const [cementContent, setCementContent] = useState<number | null>(SHRINKAGE.defaultCementContent);
  const [cementType, setCementType] = useState<CementType>(SHRINKAGE.defaultCementType);
  const [holdTime, setHoldTime] = useState<number | null>(null);
  const [shrinkageInput, setShrinkageInput] = useState<ShrinkageInput | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const shrinkage = useShrinkage(shrinkageInput);

  const runShrinkage = () => {
    try {
      const temperatureProfile_C = parseTemperatureProfile(profile);
      setShrinkageInput({
        temperatureProfile_C,
        cementType,
        ...(waterCementRatio !== null ? { waterCementRatio } : {}),
        ...(cementContent !== null ? { cementContent } : {}),
        ...(holdTime !== null ? { holdTime_hours: holdTime } : {}),
      });
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={2}>
        <Typography variant="subtitle1">Water demand</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <NumberField
              label="Packing fraction φ"
              value={phi}
              onChange={setPhiInput}
              min={WATER.phiMin}
              max={WATER.phiMax}
              error={phi !== null && !phiValid}
              helperText={phiInput === null && state.phi !== null ? 'From the Packing tab' : 'Run packing first or type φ (0–1)'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <EnumSelect label="Workability" value={workability} options={WORKABILITY_OPTIONS} onChange={setWorkability} />
          </Grid>
        </Grid>
        {!phiValid ? (
          <Alert severity="info">Water demand needs a packing fraction φ: choose a result on the Packing tab or type it above.</Alert>
        ) : (
          <AnalysisCard
            title="Water demand"
            loading={demand.isLoading || range.isLoading}
            error={demand.error ?? range.error}
            hasResult={Boolean(demand.data || range.data)}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <ResultCard
                  label={`Water demand (${MIX_OPTION_LABELS.workability[workability]})`}
                  value={demand.data?.waterDemand_pct}
                  unit="%"
                  hint="Mass % of dry mix"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                {range.data && <WaterRangeChart range={range.data} demand_pct={demand.data?.waterDemand_pct} workability={workability} />}
              </Grid>
            </Grid>
          </AnalysisCard>
        )}
      </Stack>

      <Stack
        component="form"
        spacing={2}
        onSubmit={(event) => {
          event.preventDefault();
          runShrinkage();
        }}
      >
        <Typography variant="subtitle1">Drying and firing shrinkage</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              size="small"
              fullWidth
              label="Firing temperatures, °C"
              value={profile}
              onChange={(event) => setProfile(event.target.value)}
              helperText="Comma-separated, ascending"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <NumberField
              label="Water / cement"
              value={waterCementRatio}
              onChange={setWaterCementRatio}
              min={SHRINKAGE.fractionMin}
              max={SHRINKAGE.fractionMax}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <NumberField
              label="Cement content"
              value={cementContent}
              onChange={setCementContent}
              min={SHRINKAGE.fractionMin}
              max={SHRINKAGE.fractionMax}
              helperText="Mass fraction 0–1"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <EnumSelect label="Cement type" value={cementType} options={CEMENT_OPTIONS} onChange={setCementType} />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <NumberField label="Hold time" unit="h" value={holdTime} onChange={setHoldTime} min={SHRINKAGE.holdTimeMin_hours} helperText="Empty = default" />
          </Grid>
        </Grid>
        {formError && <Alert severity="warning">{formError}</Alert>}
        <Box>
          <CalculateButton loading={shrinkage.isFetching}>Calculate shrinkage</CalculateButton>
        </Box>
      </Stack>

      {shrinkageInput && (
        <AnalysisCard title="Shrinkage" loading={shrinkage.isLoading} error={shrinkage.error} hasResult={Boolean(shrinkage.data)}>
          {shrinkage.data && (
            <Stack spacing={2}>
              {shrinkage.data.warnings.map((warning) => (
                <Alert key={warning} severity="warning">
                  {warning}
                </Alert>
              ))}
              <Grid container spacing={1}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <ResultCard label="Green porosity" value={shrinkage.data.metadata.greenPorosity_percent} unit="%" />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <ResultCard label="Final porosity" value={shrinkage.data.metadata.finalPorosity_percent} unit="%" />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <ResultCard label="Max volumetric shrinkage" value={shrinkage.data.metadata.maxShrinkage_volumetric_percent} unit="%" />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <ResultCard label="At temperature" value={shrinkage.data.metadata.tempAtMaxShrinkage_C} unit="°C" />
                </Grid>
              </Grid>
              <ShrinkageChart result={shrinkage.data} />
            </Stack>
          )}
        </AnalysisCard>
      )}
    </Stack>
  );
}
