import { Grid, Stack, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ResultCard, ResultTable, formatValue } from '../../../../components/calc';
import type { ResultTableColumn } from '../../../../components/calc';
import { TEMPERATURE_SWEEP } from '../../constants/temperature-sweep.constants';
import { isEmissivityClamped } from '../../mappers/is-emissivity-clamped.mapper';
import { RefractoryEmissivityChart } from './charts/RefractoryEmissivityChart';
import { RefractoryLambdaChart } from './charts/RefractoryLambdaChart';
import { RefractoryRankingChart } from './charts/RefractoryRankingChart';
import type { RefractoryResultsProps } from './types/refractory-results-props.type';

type TableRow = { T_K: number } & Record<string, number>;

export function RefractoryResults({ request, products, byMaterial }: RefractoryResultsProps) {
  const selected = request.materials
    .map((materialId) => products.find((product) => product.materialId === materialId))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  const clampedIcon = (
    <Tooltip title="Clamped: T outside the ε validity range">
      <InfoOutlinedIcon fontSize="inherit" color="warning" sx={{ ml: 0.5, verticalAlign: 'middle' }} />
    </Tooltip>
  );

  const details = (
    <Stack spacing={0.5}>
      {selected.map((product) => (
        <Typography key={product.materialId} variant="body2">
          <b>{product.name}</b> — {product.description}. ε valid {product.emissivityRange_K.min}–
          {product.emissivityRange_K.max} K.
        </Typography>
      ))}
    </Stack>
  );

  if (request.mode === 'single') {
    const T_K = request.temperatures_K[0];
    return (
      <Stack spacing={2}>
        {details}
        <Typography variant="subtitle1">
          At {formatValue(T_K - TEMPERATURE_SWEEP.KELVIN_OFFSET)} °C ({formatValue(T_K)} K)
        </Typography>
        <Grid container spacing={2}>
          {selected.map((product) => {
            const row = byMaterial[product.materialId]?.[0];
            if (!row) return null;
            return (
              <Grid key={product.materialId} size={{ xs: 12, sm: 6 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2">{product.name}</Typography>
                  <Stack direction="row" spacing={1}>
                    <ResultCard label="λ" value={row.lambda_WmK} unit="W/(m·K)" />
                    <ResultCard
                      label={<>ε {isEmissivityClamped(row.T_K, product.emissivityRange_K) && clampedIcon}</>}
                      value={row.emissivity}
                    />
                  </Stack>
                </Stack>
              </Grid>
            );
          })}
        </Grid>
        {selected.length >= 2 && <RefractoryRankingChart products={products} byMaterial={byMaterial} />}
      </Stack>
    );
  }

  const rows: TableRow[] = request.temperatures_K.map((T_K) => {
    const row: TableRow = { T_K, T_C: T_K - TEMPERATURE_SWEEP.KELVIN_OFFSET };
    for (const product of selected) {
      const result = byMaterial[product.materialId]?.find((item) => item.T_K === T_K);
      if (result) {
        row[`lambda:${product.materialId}`] = result.lambda_WmK;
        row[`eps:${product.materialId}`] = result.emissivity;
      }
    }
    return row;
  });

  const columns: ResultTableColumn<TableRow>[] = [
    { key: 'T_C', label: 'T', unit: '°C' },
    { key: 'T_K', label: 'T', unit: 'K' },
    ...selected.map((product) => ({ key: `lambda:${product.materialId}`, label: `λ ${product.name}`, unit: 'W/(m·K)' })),
    ...selected.map((product) => ({
      key: `eps:${product.materialId}`,
      label: `ε ${product.name}`,
      render: (row: TableRow) => (
        <>
          {formatValue(row[`eps:${product.materialId}`])}
          {isEmissivityClamped(row.T_K, product.emissivityRange_K) && clampedIcon}
        </>
      ),
    })),
  ];

  return (
    <Stack spacing={2}>
      {details}
      <RefractoryLambdaChart products={products} byMaterial={byMaterial} />
      <RefractoryEmissivityChart products={products} byMaterial={byMaterial} />
      <ResultTable columns={columns} rows={rows} rowKey={(row) => String(row.T_K)} />
    </Stack>
  );
}
