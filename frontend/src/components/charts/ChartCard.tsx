import { useMemo, useState } from 'react';
import { Box, Card, CardContent, Collapse, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import { CHART_THEME } from './chart.theme';
import { ChartDataTable } from './ChartDataTable';
import { HighchartsChart } from './HighchartsChart';
import Highcharts from './highcharts';
import type { ChartCardCommonProps } from './types/chart-card-common-props.type';
import type { ChartTableData } from './types/chart-table-data.type';

type ChartCardProps = ChartCardCommonProps & {
  options: Highcharts.Options;
  table: ChartTableData;
};

function toFilename(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'chart';
}

export function ChartCard({ title, subtitle, caption, actions, height, optionsOverride, options, table }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);

  const finalOptions = useMemo(
    () =>
      Highcharts.merge<Highcharts.Options>(
        options,
        {
          chart: { height: height ?? CHART_THEME.defaultHeight },
          exporting: { filename: toFilename(title), chartOptions: { title: { text: title } } },
        },
        optionsOverride ?? {},
      ),
    [options, height, title, optionsOverride],
  );

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" component="div">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
            {actions}
            <FormControlLabel
              control={<Switch size="small" checked={showTable} onChange={(_, checked) => setShowTable(checked)} />}
              label={<Typography variant="body2">Show table</Typography>}
            />
          </Stack>
        </Stack>
        <HighchartsChart options={finalOptions} />
        {caption && (
          <Typography variant="caption" color="text.secondary" component="div">
            {caption}
          </Typography>
        )}
        <Collapse in={showTable} unmountOnExit>
          <ChartDataTable table={table} />
        </Collapse>
      </CardContent>
    </Card>
  );
}
