import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { NumberField, formatValue } from '@/shared/ui/calc';
import { MaterialPicker, useMaterialThermalProperties } from '../../materials';
import type { MaterialPickerKind, MaterialPickerSelection } from '../../materials';
import { PROCESSES_UI } from '../constants/processes-ui.constants';
import { celsiusToKelvin } from '@/shared/utils/celsius-to-kelvin';
import type { MaterialPropertyLookupProps } from '../types/material-property-lookup-props.type';

const LOOKUP_KINDS: MaterialPickerKind[] = ['metal', 'refractory'];

export function MaterialPropertyLookup({ title = 'Take λ from material', onApplyLambda, onApplyEmissivity }: MaterialPropertyLookupProps) {
  const [material, setMaterial] = useState<MaterialPickerSelection | null>(null);
  const [temperatureC, setTemperatureC] = useState<number | null>(PROCESSES_UI.materialLookup.defaultTemperature_C);
  const properties = useMaterialThermalProperties(material, temperatureC === null ? null : celsiusToKelvin(temperatureC));
  const data = properties.data;

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1}>
        <Typography variant="subtitle2">{title}</Typography>
        <Stack direction="row" spacing={1}>
          <Box sx={{ flex: 1 }}>
            <MaterialPicker kinds={LOOKUP_KINDS} value={material} onChange={setMaterial} size="small" />
          </Box>
          <Box sx={{ width: 130 }}>
            <NumberField label="Temperature" unit="°C" value={temperatureC} onChange={setTemperatureC} />
          </Box>
        </Stack>
        {properties.isFetching && <CircularProgress size={20} />}
        {properties.error && <Alert severity="warning">{properties.error.message}</Alert>}
        {data && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2">
              λ = {formatValue(data.lambda_WmK)} W/(m·K), ε = {formatValue(data.emissivity)}
            </Typography>
            <Button size="small" onClick={() => onApplyLambda(data.lambda_WmK)}>
              Use λ
            </Button>
            {onApplyEmissivity && (
              <Button size="small" onClick={() => onApplyEmissivity(data.emissivity)}>
                Use ε
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
