import { useMemo, useState } from 'react';
import { Alert, Box, Grid, Stack } from '@mui/material';
import { CalculateButton, CalculatorPage, EnumSelect, NumberField, ResultCard, ResultPanel } from '../../../../components/calc';
import type { NumberFieldSpec } from '../../types/number-field-spec.type';
import { NumberFieldGrid } from '../../components/NumberFieldGrid';
import { BODY_SHAPES } from './constants/body-shapes.constants';
import { HTC_DEFAULTS } from './constants/htc-defaults.constants';
import { useBodyGeometry } from './hooks/useBodyGeometry';
import { toBodyGeometryInput } from './mappers/body-geometry-request.mapper';
import type { BodyDimensionKey } from './types/body-dimension-key.type';
import type { BodyGeometryDraft } from './types/body-geometry-draft.type';
import type { BodyGeometryInput } from './types/body-geometry-input.type';
import type { BodyShapeKey } from './types/body-shape-key.type';

export function BodyGeometryCalculator() {
  const [draft, setDraft] = useState<BodyGeometryDraft>(HTC_DEFAULTS.body);
  const [input, setInput] = useState<BodyGeometryInput | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const body = useBodyGeometry(input);
  const shape = BODY_SHAPES.find((item) => item.value === draft.geometry) ?? BODY_SHAPES[0];
  const fields = useMemo(
    () => shape.dims.map((dim): NumberFieldSpec<BodyDimensionKey> => ({ key: dim.key, label: dim.label, unit: 'm', min: 0, required: true })),
    [shape],
  );

  const calculate = () => {
    try {
      setInput(toBodyGeometryInput(draft, shape));
      setFormError(null);
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <CalculatorPage
      title="Body geometry"
      description="Surface area, volume and mean beam length of a body, e.g. for radiation from a gas volume."
      inputs={
        <Stack
          component="form"
          spacing={2}
          onSubmit={(event) => {
            event.preventDefault();
            calculate();
          }}
        >
          <EnumSelect<BodyShapeKey>
            label="Shape"
            value={draft.geometry}
            options={BODY_SHAPES}
            onChange={(geometry) => setDraft((previous) => ({ ...previous, geometry }))}
          />
          <NumberFieldGrid
            fields={fields}
            values={draft.dims}
            onChange={(key, value) => setDraft((previous) => ({ ...previous, dims: { ...previous.dims, [key]: value } }))}
          />
          {shape.usesInsulation && (
            <NumberField
              label="Insulation thickness h"
              unit="m"
              min={0}
              value={draft.h}
              onChange={(h) => setDraft((previous) => ({ ...previous, h }))}
              helperText="Optional; enlarges the outer surface"
            />
          )}
          {formError && <Alert severity="warning">{formError}</Alert>}
          <Box>
            <CalculateButton loading={body.isFetching} />
          </Box>
        </Stack>
      }
      results={
        <ResultPanel loading={body.isLoading} error={body.error} hasResult={Boolean(body.data)}>
          {body.data && (
            <Grid container spacing={1}>
              <Grid size={{ xs: 6, md: 3 }}>
                <ResultCard label="Surface" value={body.data.surface} unit="m²" />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <ResultCard label="Volume" value={body.data.volume} unit="m³" />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <ResultCard label="Mean beam length" value={body.data.meanBeamLength} unit="m" />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <ResultCard label="Characteristic length" value={body.data.characteristicLength} unit="m" />
              </Grid>
            </Grid>
          )}
        </ResultPanel>
      }
    />
  );
}
