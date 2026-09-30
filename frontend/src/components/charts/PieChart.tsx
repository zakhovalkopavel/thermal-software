import { useMemo } from 'react';
import Highcharts from './highcharts';
import { chartFormat } from './chart.format';
import { CHART_THEME } from './chart.theme';
import { ChartCard } from './ChartCard';
import type { ChartTableData } from './types/chart-table-data.type';
import type { PieChartProps } from './types/pie-chart-props.type';

const HATCHED_OPACITY = 0.4;

export function PieChart(props: PieChartProps) {
  const { data, unit, seriesName = 'Share', donut } = props;

  const { options, table } = useMemo(() => {
    const slices = data
      .filter((slice) => slice.y > 0)
      .map((slice, index) => {
        const base = slice.color ?? CHART_THEME.colors[index % CHART_THEME.colors.length];
        return {
          name: slice.name,
          y: slice.y,
          color: slice.hatched ? Highcharts.color(base).setOpacity(HATCHED_OPACITY).get('rgba') : base,
        };
      });

    const chartOptions: Highcharts.Options = {
      chart: { type: 'pie' },
      tooltip: {
        formatter() {
          return `<b>${this.name}</b><br/>${chartFormat.value(Number(this.y), unit)} (${(this.percentage ?? 0).toFixed(1)} %)`;
        },
      },
      plotOptions: {
        pie: {
          ...(donut ? { innerSize: '50%' } : {}),
          dataLabels: { enabled: true, format: '{point.name}: {point.percentage:.1f} %', style: { fontWeight: 'normal' } },
        },
      },
      series: [{ type: 'pie', name: seriesName, data: slices as Highcharts.PointOptionsObject[] }],
    };

    const tableData: ChartTableData = {
      columns: ['', chartFormat.axisTitle(seriesName, unit)],
      rows: data.map((slice) => [slice.name, slice.y]),
    };
    return { options: chartOptions, table: tableData };
  }, [data, unit, seriesName, donut]);

  return <ChartCard {...props} options={options} table={table} />;
}
