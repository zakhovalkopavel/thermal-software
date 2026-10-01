import { Alert, Box, Stack, Typography } from '@mui/material';
import { CalculateButton, EnumSelect } from '@/shared/ui/calc';
import { AdvancedFields } from '../../components/AdvancedFields';
import { MaterialPropertyLookup } from '../../components/MaterialPropertyLookup';
import { NumberFieldGrid } from '../../components/NumberFieldGrid';
import { THERMAL_FIELDS } from './constants/thermal-fields.constants';
import { THERMAL_OPTIONS } from './constants/thermal-options.constants';
import { THERMAL_SHAPES } from './constants/thermal-shapes.constants';
import type { ShapeFieldKey } from './types/shape-field-key.type';
import type { ThermalDraft } from './types/thermal-draft.type';
import type { ThermalFieldKey } from './types/thermal-field-key.type';
import type { ThermalInputsFormProps } from './types/thermal-inputs-form-props.type';
import type { ThermalShapeKey } from './types/thermal-shape-key.type';

export function ThermalInputsForm({ draft, onChange, onSubmit, loading, error }: ThermalInputsFormProps) {
  const shape = THERMAL_SHAPES.find((item) => item.value === draft.geometry) ?? THERMAL_SHAPES[0];
  const convective = draft.bcType === 'BC_III';
  const patch = (next: Partial<ThermalDraft>) => onChange({ ...draft, ...next });
  const setValue = (key: ThermalFieldKey, value: number | null) => onChange({ ...draft, values: { ...draft.values, [key]: value } });
  const setShapeValue = (key: ShapeFieldKey, value: number | null) => onChange({ ...draft, shape: { ...draft.shape, [key]: value } });

  return (
    <Stack
      component="form"
      spacing={2}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <EnumSelect label="Boundary condition" value={draft.bcType} options={THERMAL_OPTIONS.bcTypes} onChange={(bcType) => patch({ bcType })} />
      <EnumSelect<ThermalShapeKey> label="Body" value={draft.geometry} options={THERMAL_SHAPES} onChange={(geometry) => patch({ geometry })} />
      <NumberFieldGrid fields={shape.fields} values={draft.shape} onChange={setShapeValue} />
      <Typography variant="subtitle2">Conditions and material</Typography>
      <NumberFieldGrid fields={THERMAL_FIELDS.main} values={draft.values} onChange={setValue} />
      {convective && <NumberFieldGrid fields={THERMAL_FIELDS.convective} values={draft.values} onChange={setValue} columns={1} />}
      <MaterialPropertyLookup onApplyLambda={(lambda) => setValue('lambda', lambda)} />
      <EnumSelect
        label="Initial profile"
        value={draft.initialProfile}
        options={THERMAL_OPTIONS.initialProfiles}
        onChange={(initialProfile) => patch({ initialProfile })}
      />
      {draft.initialProfile === 'parabolic' && <NumberFieldGrid fields={THERMAL_FIELDS.parabolic} values={draft.values} onChange={setValue} />}
      <AdvancedFields>
        <Stack spacing={2}>
          <NumberFieldGrid fields={THERMAL_FIELDS.series} values={draft.values} onChange={setValue} columns={1} />
          {convective && draft.geometry === 'parallelepiped' && (
            <NumberFieldGrid fields={THERMAL_FIELDS.biPerAxis} values={draft.values} onChange={setValue} columns={3} />
          )}
          {convective && draft.geometry === 'finite_cylinder' && (
            <NumberFieldGrid fields={THERMAL_FIELDS.biCylinder} values={draft.values} onChange={setValue} />
          )}
        </Stack>
      </AdvancedFields>
      {error && <Alert severity="warning">{error}</Alert>}
      <Box>
        <CalculateButton loading={loading} />
      </Box>
    </Stack>
  );
}
