import { Chip, Stack, Tab, Tabs } from '@mui/material';
import { NumberField } from '@/shared/ui/calc';
import { GLASSES_UI } from './constants/glasses-ui.constants';
import { VISCOSITY_LEVELS } from './constants/viscosity-levels.constants';
import type { GlassTask } from './types/glass-task.type';
import type { GlassTaskTabsProps } from './types/glass-task-tabs-props.type';

export function GlassTaskTabs({ value, onChange }: GlassTaskTabsProps) {
  const set = (patch: Partial<typeof value>) => onChange({ ...value, ...patch });

  return (
    <Stack spacing={1.5}>
      <Tabs value={value.task} onChange={(_, task: GlassTask) => set({ task })} variant="fullWidth">
        <Tab value="at-temperature" label="At T" />
        <Tab value="profile" label="Profile" />
        <Tab value="temperature-at-viscosity" label="T at η" />
      </Tabs>
      {value.task === 'at-temperature' && (
        <NumberField label="Temperature" unit="°C" value={value.temperature_C} onChange={(temperature_C) => set({ temperature_C })} />
      )}
      {value.task === 'profile' && (
        <Stack direction="row" spacing={1}>
          <NumberField label="From" unit="°C" value={value.from} onChange={(from) => set({ from })} />
          <NumberField label="To" unit="°C" value={value.to} onChange={(to) => set({ to })} />
          <NumberField label="Step" unit="°C" value={value.step} onChange={(step) => set({ step })} min={0} />
        </Stack>
      )}
      {value.task === 'temperature-at-viscosity' && (
        <Stack spacing={1}>
          <NumberField
            label="Target log₁₀η"
            unit="log Pa·s"
            value={value.targetLogEta}
            onChange={(targetLogEta) => set({ targetLogEta })}
            min={GLASSES_UI.targetLogEtaMin}
            max={GLASSES_UI.targetLogEtaMax}
          />
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {VISCOSITY_LEVELS.map((level) => (
              <Chip
                key={level.key}
                size="small"
                label={`${level.label} ${level.logEta}`}
                color={value.targetLogEta === level.logEta ? 'primary' : 'default'}
                onClick={() => set({ targetLogEta: level.logEta })}
              />
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
