import { useState } from 'react';
import { Alert, Box, Button, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { CalculateButton, CalculatorPage, EnumSelect, GasCompositionInput, ResultCard, ResultPanel, formatValue } from '../../../../components/calc';
import { NumberFieldGrid } from '../../components/NumberFieldGrid';
import { WallLayersEditor } from '../../components/WallLayersEditor';
import { PROCESSES_UI } from '../../constants/processes-ui.constants';
import { useWallMaterialNames } from '../../hooks/useWallMaterialNames';
import { kelvinToCelsius } from '../../mappers/kelvin-to-celsius.mapper';
import type { SmokeHandOff } from '../../types/smoke-hand-off.type';
import { HeatFluxChart } from './charts/HeatFluxChart';
import { InnerHtcPieChart } from './charts/InnerHtcPieChart';
import { WallTemperatureChart } from './charts/WallTemperatureChart';
import { WALL_FIELDS } from './constants/wall-fields.constants';
import { WALL_GEOMETRIES } from './constants/wall-geometries.constants';
import { WALL_PRESETS } from './constants/wall-presets.constants';
import { WALL_UI } from './constants/wall-ui.constants';
import { useMultilayerWall } from './hooks/useMultilayerWall';
import { withSmoke } from './mappers/smoke-into-wall-draft.mapper';
import { toWallDraftFromPreset } from './mappers/wall-draft-from-preset.mapper';
import { toWallProfile } from './mappers/wall-profile.mapper';
import { toMultilayerWallInput } from './mappers/wall-request.mapper';
import type { WallCalculation } from './types/wall-calculation.type';
import type { WallDraft } from './types/wall-draft.type';
import type { WallFieldKey } from './types/wall-field-key.type';
import type { WallVariant } from './types/wall-variant.type';

const SMOKE_SPECIES = [...PROCESSES_UI.smokeSpecies];
const DEFAULT_PRESET = WALL_PRESETS.find((preset) => preset.id === WALL_UI.defaultPresetId) ?? WALL_PRESETS[0];

const isSmokeHandOff = (state: unknown): state is SmokeHandOff =>
  typeof state === 'object' && state !== null && 'tFlame_K' in state && 'mGas_kgs' in state && 'composition' in state;

const celsius = (kelvin: number) => kelvinToCelsius(kelvin);

export function MultilayerWallSection() {
  const location = useLocation();
  const smoke = isSmokeHandOff(location.state) ? location.state : null;
  const [draft, setDraft] = useState<WallDraft>(() => {
    const initial = toWallDraftFromPreset(DEFAULT_PRESET);
    return smoke ? withSmoke(initial, smoke) : initial;
  });
  const [presetId, setPresetId] = useState<string>(DEFAULT_PRESET.id);
  const [calculation, setCalculation] = useState<WallCalculation | null>(null);
  const [pinned, setPinned] = useState<WallVariant[]>([]);
  const [pinCounter, setPinCounter] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const names = useWallMaterialNames();
  const wall = useMultilayerWall(calculation?.input ?? null);

  const setValue = (key: WallFieldKey, value: number | null) => setDraft((previous) => ({ ...previous, values: { ...previous.values, [key]: value } }));

  const loadPreset = (id: string) => {
    const preset = WALL_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setPresetId(id);
    setDraft(toWallDraftFromPreset(preset));
  };

  const calculate = () => {
    try {
      const input = toMultilayerWallInput(draft);
      setCalculation({ input, layerNames: input.layers.map((layer) => names.get(layer.material) ?? layer.material) });
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  const pin = () => {
    if (!calculation || !wall.data) return;
    const number = pinCounter + 1;
    const layersText = calculation.input.layers.map((layer, index) => `${calculation.layerNames[index]} ${layer.thicknessMm} mm`).join(' + ');
    const variant: WallVariant = { id: `pin-${number}`, label: `#${number}: ${layersText}`, points: toWallProfile(calculation.input, wall.data) };
    setPinCounter(number);
    setPinned((previous) => [...previous, variant].slice(-WALL_UI.maxPinned));
  };

  const result = wall.data;

  return (
    <CalculatorPage
      title="Multilayer wall"
      description="Heat loss and temperatures through a furnace wall of metal and refractory layers heated by flue gas."
      inputsWidth="wide"
      inputs={
        <Stack
          component="form"
          spacing={2}
          onSubmit={(event) => {
            event.preventDefault();
            calculate();
          }}
        >
          {smoke && <Alert severity="info">Flame temperature, gas flow and composition were pre-filled from Combustion.</Alert>}
          <TextField select size="small" fullWidth label="Preset" value={presetId} onChange={(event) => loadPreset(event.target.value)}>
            {WALL_PRESETS.map((preset) => (
              <MenuItem key={preset.id} value={preset.id}>
                {preset.label}
              </MenuItem>
            ))}
          </TextField>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <EnumSelect
                label="Geometry"
                value={draft.geometry}
                options={WALL_GEOMETRIES}
                onChange={(geometry) => setDraft((previous) => ({ ...previous, geometry }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <NumberFieldGrid fields={WALL_FIELDS.geometry} values={draft.values} onChange={setValue} />
            </Grid>
          </Grid>
          <WallLayersEditor value={draft.layers} onChange={(layers) => setDraft((previous) => ({ ...previous, layers }))} />
          <Typography variant="subtitle2">Flue gas</Typography>
          <NumberFieldGrid fields={WALL_FIELDS.gas} values={draft.values} onChange={setValue} columns={3} />
          <GasCompositionInput
            value={draft.composition}
            onChange={(composition) => setDraft((previous) => ({ ...previous, composition }))}
            species={SMOKE_SPECIES}
          />
          <NumberFieldGrid fields={WALL_FIELDS.advanced} values={draft.values} onChange={setValue} columns={3} />
          {formError && <Alert severity="warning">{formError}</Alert>}
          <Box>
            <CalculateButton loading={wall.isFetching} />
          </Box>
        </Stack>
      }
      results={
        <ResultPanel loading={wall.isLoading} error={wall.error} hasResult={Boolean(result && calculation)}>
          {result && calculation && (
            <Stack spacing={2}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 6, md: 4 }}>
                  <ResultCard label="Inner surface" value={celsius(result.tInner_K)} unit="°C" hint={`${formatValue(result.tInner_K)} K`} />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <ResultCard label="Outer surface" value={celsius(result.tOuter_K)} unit="°C" hint={`${formatValue(result.tOuter_K)} K`} />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <ResultCard label="Gas, average / end" value={celsius(result.tGasAverage_K)} unit="°C" hint={`End ${formatValue(celsius(result.tGasEnd_K))} °C`} />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <ResultCard label="Heat flow in / out" value={result.fluxInner_W} unit="W" hint={`Out ${formatValue(result.fluxOuter_W)} W`} />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <ResultCard label="Inner flux density" value={result.fluxInnerDensity_Wm2} unit="W/m²" />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <ResultCard label="α inner / outer" value={result.alphaInner.total_Wm2K} unit="W/(m²·K)" hint={`Outer ${formatValue(result.alphaOuter_Wm2K)} W/(m²·K)`} />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <ResultCard label="Surfaces inner / outer" value={result.sInner_m2} unit="m²" hint={`Outer ${formatValue(result.sOuter_m2)} m²`} />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <ResultCard label="Total thickness" value={result.totalThickness_mm} unit="mm" />
                </Grid>
                {result.betweenLayers.map((between, index) => (
                  <Grid key={between.name} size={{ xs: 6, md: 4 }}>
                    <ResultCard
                      label={`Interface ${calculation.layerNames[index]} / ${calculation.layerNames[index + 1]}`}
                      value={between.tCelsius}
                      unit="°C"
                    />
                  </Grid>
                ))}
              </Grid>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={pin}>
                  Pin result
                </Button>
                <Button onClick={() => setPinned([])} disabled={pinned.length === 0}>
                  Clear pinned ({pinned.length}/{WALL_UI.maxPinned})
                </Button>
              </Stack>
              <WallTemperatureChart calculation={calculation} result={result} pinned={pinned} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <HeatFluxChart result={result} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <InnerHtcPieChart result={result} />
                </Grid>
              </Grid>
            </Stack>
          )}
        </ResultPanel>
      }
    />
  );
}
