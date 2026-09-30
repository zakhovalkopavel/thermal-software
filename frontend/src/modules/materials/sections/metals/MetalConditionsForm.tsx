import { Alert, Box, Button, IconButton, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { CalculateButton } from '../../../../components/calc';
import { MaterialPicker } from '../../components/MaterialPicker';
import { TemperatureSweepFields } from '../../components/TemperatureSweepFields';
import { METALS_UI } from './constants/metals-ui.constants';
import type { MetalConditionsFormProps } from './types/metal-conditions-form-props.type';

export function MetalConditionsForm({
  metals,
  grades,
  onGradesChange,
  sweep,
  onSweepChange,
  onCalculate,
  loading,
  formError,
}: MetalConditionsFormProps) {
  const setGrade = (index: number, materialId: string | null) =>
    onGradesChange(grades.map((grade, i) => (i === index ? materialId : grade)));

  return (
    <Stack
      spacing={2}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        onCalculate();
      }}
    >
      <Typography variant="subtitle2">Metal grade</Typography>
      {grades.map((grade, index) => {
        const metal = metals.find((item) => item.materialId === grade);
        return (
          <Stack key={index} spacing={0.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ flex: 1 }}>
                <MaterialPicker
                  kinds={['metal']}
                  label={index === 0 ? 'Grade' : 'Compare with'}
                  excludeIds={grades.filter((id): id is string => Boolean(id) && id !== grade)}
                  value={grade ? { kind: 'metal', materialId: grade } : null}
                  onChange={(selection) => setGrade(index, selection?.materialId ?? null)}
                />
              </Box>
              {index > 0 && (
                <IconButton aria-label="Remove grade" onClick={() => onGradesChange(grades.filter((_, i) => i !== index))}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
            {metal && (
              <Typography variant="caption" color="text.secondary">
                {metal.description} ε valid {metal.emissivityRange_K.min}–{metal.emissivityRange_K.max} K.
              </Typography>
            )}
          </Stack>
        );
      })}
      {grades.length < METALS_UI.maxCompared && (
        <Box>
          <Button size="small" startIcon={<AddIcon />} onClick={() => onGradesChange([...grades, null])}>
            Add grade to compare
          </Button>
        </Box>
      )}
      <Typography variant="subtitle2">Temperature</Typography>
      <TemperatureSweepFields value={sweep} onChange={onSweepChange} />
      {formError && <Alert severity="warning">{formError}</Alert>}
      <Box>
        <CalculateButton loading={loading} disabled={!grades.some(Boolean)} />
      </Box>
    </Stack>
  );
}
