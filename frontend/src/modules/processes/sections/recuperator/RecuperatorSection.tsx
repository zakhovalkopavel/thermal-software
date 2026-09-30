import { useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { CalculateButton, CalculatorPage, EnumSelect, ResultPanel } from '../../../../components/calc';
import { AdvancedFields } from '../../components/AdvancedFields';
import { MaterialPropertyLookup } from '../../components/MaterialPropertyLookup';
import { NumberFieldGrid } from '../../components/NumberFieldGrid';
import { useFuels } from '../../hooks/useFuels';
import type { CombustionHandOff } from '../../types/combustion-hand-off.type';
import type { CombustionMode } from '../../types/combustion-mode.type';
import type { CombustionModeInput } from '../../types/combustion-mode-input.type';
import { COMBUSTION_MODES } from '../combustion/constants/combustion-modes.constants';
import { CombustionModeForm } from '../combustion/forms/CombustionModeForm';
import { toCombustionModeInput } from '../combustion/mappers/combustion-mode-input.mapper';
import { toCombustionRequest } from '../combustion/mappers/combustion-request.mapper';
import type { CombustionDrafts } from '../combustion/types/combustion-drafts.type';
import { RecuperatorResults } from './RecuperatorResults';
import { HOLE_FORMS } from './constants/hole-forms.constants';
import { RECUPERATOR_DEFAULTS } from './constants/recuperator-defaults.constants';
import { RECUPERATOR_FIELDS } from './constants/recuperator-fields.constants';
import { useRecuperator } from './hooks/useRecuperator';
import { toRecuperatorInput } from './mappers/recuperator-request.mapper';
import type { RecuperatorDraft } from './types/recuperator-draft.type';
import type { RecuperatorFieldKey } from './types/recuperator-field-key.type';
import type { RecuperatorInput } from './types/recuperator-input.type';

const MODE_OPTIONS = COMBUSTION_MODES.map((item) => ({ value: item.mode, label: item.label }));

const isCombustionHandOff = (state: unknown): state is CombustionHandOff =>
  typeof state === 'object' && state !== null && 'combustion' in state && typeof state.combustion === 'object' && state.combustion !== null;

export function RecuperatorSection() {
  const location = useLocation();
  const [handOff, setHandOff] = useState<CombustionModeInput | null>(() =>
    isCombustionHandOff(location.state) ? location.state.combustion : null,
  );
  const fuels = useFuels();
  const [mode, setMode] = useState<CombustionMode>(RECUPERATOR_DEFAULTS.mode);
  const [combustionDrafts, setCombustionDrafts] = useState<CombustionDrafts>(RECUPERATOR_DEFAULTS.combustion);
  const [draft, setDraft] = useState<RecuperatorDraft>(RECUPERATOR_DEFAULTS.draft);
  const [input, setInput] = useState<RecuperatorInput | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const recuperator = useRecuperator(input);
  const fuelList = useMemo(() => fuels.data ?? [], [fuels.data]);
  const handOffLabel = COMBUSTION_MODES.find((item) => item.mode === handOff?.mode)?.label;

  const setValue = (key: RecuperatorFieldKey, value: number | null) => setDraft((previous) => ({ ...previous, values: { ...previous.values, [key]: value } }));

  const calculate = () => {
    try {
      const combustion = handOff ?? toCombustionModeInput(toCombustionRequest(mode, combustionDrafts, fuelList));
      setInput(toRecuperatorInput(draft, combustion));
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <CalculatorPage
      title="Recuperator"
      description="Flue-gas / air recuperator: channel geometry and wall materials → length, outlet temperatures and energy returned."
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
          <Typography variant="subtitle2">Combustion</Typography>
          {handOff ? (
            <Alert
              severity="info"
              action={
                <Button color="inherit" size="small" onClick={() => setHandOff(null)}>
                  Edit here
                </Button>
              }
            >
              Using the {handOffLabel ?? handOff.mode} combustion input from the Combustion page.
            </Alert>
          ) : (
            <>
              <EnumSelect<CombustionMode> label="Combustion mode" value={mode} options={MODE_OPTIONS} onChange={setMode} />
              {fuels.error && <Alert severity="warning">Fuel presets could not be loaded; enter a custom fuel.</Alert>}
              <CombustionModeForm mode={mode} drafts={combustionDrafts} onChange={setCombustionDrafts} fuels={fuelList} />
            </>
          )}
          <NumberFieldGrid fields={RECUPERATOR_FIELDS.air} values={draft.values} onChange={setValue} />
          <Typography variant="subtitle2">Geometry</Typography>
          <EnumSelect
            label="Channel shape"
            value={draft.holeForm}
            options={HOLE_FORMS}
            onChange={(holeForm) => setDraft((previous) => ({ ...previous, holeForm }))}
          />
          <NumberFieldGrid fields={RECUPERATOR_FIELDS.geometry} values={draft.values} onChange={setValue} columns={3} />
          {draft.holeForm === 'circle_in_ring' && <NumberFieldGrid fields={RECUPERATOR_FIELDS.ring} values={draft.values} onChange={setValue} />}
          <FormControlLabel
            control={
              <Checkbox checked={draft.smokeTurbulence} onChange={(event) => setDraft((previous) => ({ ...previous, smokeTurbulence: event.target.checked }))} />
            }
            label="Smoke turbulence correction"
          />
          <Typography variant="subtitle2">Wall and insulation</Typography>
          <NumberFieldGrid fields={RECUPERATOR_FIELDS.materials} values={draft.values} onChange={setValue} columns={3} />
          <MaterialPropertyLookup
            title="Take wall λ / ε from material"
            onApplyLambda={(lambda) => setValue('refractoryLambda_WmK', lambda)}
            onApplyEmissivity={(emissivity) => setValue('refractoryEmissivity', emissivity)}
          />
          <AdvancedFields>
            <NumberFieldGrid fields={RECUPERATOR_FIELDS.advanced} values={draft.values} onChange={setValue} />
          </AdvancedFields>
          {formError && <Alert severity="warning">{formError}</Alert>}
          <Box>
            <CalculateButton loading={recuperator.isFetching} />
          </Box>
        </Stack>
      }
      results={
        <ResultPanel loading={recuperator.isLoading} error={recuperator.error} hasResult={Boolean(recuperator.data && input)}>
          {recuperator.data && input && <RecuperatorResults input={input} result={recuperator.data} />}
        </ResultPanel>
      }
    />
  );
}
