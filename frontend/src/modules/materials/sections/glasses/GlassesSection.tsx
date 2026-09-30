import { useMemo, useState } from 'react';
import { Alert, Box, Divider, Stack } from '@mui/material';
import { ValidationError } from 'yup';
import { CalculateButton, CalculatorPage, GLASS_OXIDES, ResultPanel, pickOxides } from '../../../../components/calc';
import type { CompositionUnit } from '../../../../components/calc';
import { useMaterialsByGroup } from '../../hooks/useMaterialsByGroup';
import type { MaterialEntry } from '../../types/material-entry.type';
import { GLASS_REFERENCES } from './constants/glass-references.constants';
import { GLASSES_UI } from './constants/glasses-ui.constants';
import { GlassCompareSelect } from './GlassCompareSelect';
import { GlassCompositionForm } from './GlassCompositionForm';
import { glassFormSchema } from './glass-form.schema';
import { GlassResults } from './GlassResults';
import { GlassTaskTabs } from './GlassTaskTabs';
import { useGlassCalculation } from './hooks/useGlassCalculation';
import { toGlassGrid } from './mappers/glass-grid.mapper';
import type { GlassCalculationRequest } from './types/glass-calculation-request.type';
import type { GlassModel } from './types/glass-model.type';
import type { GlassTaskState } from './types/glass-task-state.type';

const sameComposition = (a: Record<string, number>, b: Record<string, number>) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((key) => (a[key] ?? 0) === (b[key] ?? 0));
};

export function GlassesSection() {
  const glasses = useMaterialsByGroup('glasses');
  const library = useMemo(() => glasses.data ?? [], [glasses.data]);

  const [presetId, setPresetId] = useState<string>(GLASSES_UI.customPresetId);
  const [presetComposition, setPresetComposition] = useState<Record<string, number>>({});
  const [ignoredKeys, setIgnoredKeys] = useState<string[]>([]);
  const [composition, setComposition] = useState<Record<string, number>>({});
  const [unit, setUnit] = useState<CompositionUnit>('wt');
  const [model, setModel] = useState<GlassModel | null>(null);
  const [task, setTask] = useState<GlassTaskState>(GLASSES_UI.defaultTask);
  const [selectedReferences, setSelectedReferences] = useState<string[]>([...GLASS_REFERENCES.defaultSelection]);
  const [request, setRequest] = useState<GlassCalculationRequest | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const result = useGlassCalculation(request);

  const loadPreset = (id: string) => {
    setPresetId(id);
    setIgnoredKeys([]);
    const entry = library.find((glass) => glass.materialId === id);
    if (!entry) return;
    const { kept, ignored } = pickOxides(entry.composition, GLASS_OXIDES);
    setPresetComposition(kept);
    setComposition(kept);
    setUnit('wt');
    setIgnoredKeys(Object.keys(ignored));
  };

  const [initialised, setInitialised] = useState(false);
  if (!initialised && library.length > 0) {
    setInitialised(true);
    loadPreset(GLASSES_UI.defaultPresetId);
  }

  const referenceEntries = useMemo(
    () => GLASS_REFERENCES.ids.flatMap((id) => library.filter((glass) => glass.materialId === id)),
    [library],
  );
  const unedited =
    presetId !== GLASSES_UI.customPresetId && unit === 'wt' && sameComposition(composition, presetComposition);
  const duplicateId = unedited && (GLASS_REFERENCES.ids as readonly string[]).includes(presetId) ? presetId : null;
  const [presetEntry, setPresetEntry] = useState<MaterialEntry | null>(null);

  const calculate = () => {
    try {
      glassFormSchema.validateSync({ composition, ...task }, { abortEarly: false });
      const grid =
        task.task === 'profile'
          ? toGlassGrid(task.from, task.to, task.step)
          : toGlassGrid(GLASSES_UI.chartGrid.from, GLASSES_UI.chartGrid.to, GLASSES_UI.chartGrid.step);
      setRequest({
        composition: Object.fromEntries(Object.entries(composition).filter(([, value]) => value > 0)),
        unit,
        model,
        task: task.task,
        temperature_C: task.temperature_C,
        targetLogEta: task.targetLogEta,
        grid,
        references: referenceEntries
          .filter((entry) => selectedReferences.includes(entry.materialId) && entry.materialId !== duplicateId)
          .map((entry) => ({ materialId: entry.materialId, name: entry.name, composition: entry.composition })),
      });
      setPresetEntry(unedited ? (library.find((glass) => glass.materialId === presetId) ?? null) : null);
      setFormErrors([]);
    } catch (error) {
      setFormErrors(error instanceof ValidationError ? error.errors : [(error as Error).message]);
    }
  };

  return (
    <CalculatorPage
      title="Glasses"
      description="Viscosity from the oxide composition: η at T, η(T) profile, fixed points and T at a target viscosity, compared with library glasses."
      inputs={
        <Stack
          spacing={2}
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            calculate();
          }}
        >
          <GlassCompositionForm
            presets={library}
            presetId={presetId}
            onPresetChange={(id) => (id === GLASSES_UI.customPresetId ? setPresetId(id) : loadPreset(id))}
            ignoredKeys={ignoredKeys}
            composition={composition}
            onCompositionChange={setComposition}
            unit={unit}
            onUnitChange={setUnit}
            model={model}
            onModelChange={setModel}
          />
          <Divider />
          <GlassCompareSelect
            references={referenceEntries}
            selected={selectedReferences}
            onChange={setSelectedReferences}
            duplicateId={duplicateId}
          />
          <Divider />
          <GlassTaskTabs value={task} onChange={setTask} />
          {formErrors.map((message) => (
            <Alert key={message} severity="warning">
              {message}
            </Alert>
          ))}
          <Box>
            <CalculateButton loading={result.isLoading} />
          </Box>
        </Stack>
      }
      results={
        <ResultPanel
          loading={result.isLoading}
          error={result.error ?? glasses.error}
          hasResult={Boolean(request) && result.isComplete}
        >
          {request && <GlassResults request={request} result={result} presetEntry={presetEntry} />}
        </ResultPanel>
      }
    />
  );
}
