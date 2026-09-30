import { Grid } from '@mui/material';
import { NumberField } from '../../../../../components/calc';
import { MINERAL_COMPOSITIONS_UI } from '../constants/mineral-compositions-ui.constants';
import { MIX_OPTION_LABELS } from '../constants/mix-option-labels.constants';
import type { BlendOptionsFormProps } from '../types/blend-options-form-props.type';
import type { CompactionScenario } from '../types/compaction-scenario.type';
import type { PackingModel } from '../types/packing-model.type';
import type { PsdMethod } from '../types/psd-method.type';
import { ChipToggleGroup } from './ChipToggleGroup';

const SHRINKAGE = MINERAL_COMPOSITIONS_UI.shrinkage;

const optionsOf = <T extends string>(labels: Record<T, string>) =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }));

const Q_OPTIONS = MINERAL_COMPOSITIONS_UI.blend.qChoices.map((q): { value: number; label: string } => ({ value: q, label: `q = ${q}` }));
const METHOD_OPTIONS = optionsOf<PsdMethod>(MIX_OPTION_LABELS.psdMethod);
const MODEL_OPTIONS = optionsOf<PackingModel>(MIX_OPTION_LABELS.packingModel);
const SCENARIO_OPTIONS = optionsOf<CompactionScenario>(MIX_OPTION_LABELS.scenario);

export function BlendOptionsForm({ value, onChange }: BlendOptionsFormProps) {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <ChipToggleGroup
          label="Distribution modulus q"
          options={Q_OPTIONS}
          selected={value.qValues}
          onChange={(qValues) => onChange({ ...value, qValues: [...qValues].sort((a, b) => a - b) })}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <ChipToggleGroup label="PSD methods" options={METHOD_OPTIONS} selected={value.methods} onChange={(methods) => onChange({ ...value, methods })} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <ChipToggleGroup
          label="Packing models"
          options={MODEL_OPTIONS}
          selected={value.packingModels}
          onChange={(packingModels) => onChange({ ...value, packingModels })}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ChipToggleGroup
          label="Compaction scenarios"
          options={SCENARIO_OPTIONS}
          selected={value.scenarios}
          onChange={(scenarios) => onChange({ ...value, scenarios })}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <NumberField
          label="Water / cement"
          value={value.waterCementRatio ?? null}
          onChange={(waterCementRatio) => onChange({ ...value, waterCementRatio: waterCementRatio ?? undefined })}
          min={SHRINKAGE.fractionMin}
          max={SHRINKAGE.fractionMax}
          helperText="Empty = backend default"
        />
      </Grid>
    </Grid>
  );
}
