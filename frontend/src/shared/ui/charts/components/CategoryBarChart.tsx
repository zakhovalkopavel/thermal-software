import { useMemo } from 'react';
import type Highcharts from 'highcharts';
import { buildAxisOptions } from '@/shared/ui/charts/mappers/build-axis-options';
import { chartFormat } from '@/shared/ui/charts/mappers/chart.format';
import { ChartCard } from './ChartCard';
import type { CategoryBarChartProps } from '@/shared/ui/charts/types/category-bar-chart-props.type';
import type { ChartTableData } from '@/shared/ui/charts/types/chart-table-data.type';

function pointValue(point: CategoryBarChartProps['series'][number]['data'][number]): number | null {
  return typeof point === 'object' && point !== null ? point.y : point;
}

export function CategoryBarChart(props: CategoryBarChartProps) {
  const { categories, series, yAxis, horizontal, stacking, yPlotLines, showLegend, tooltipExtra } = props;

  const { options, table } = useMemo(() => {
    const barType = horizontal ? 'bar' : 'column';
    const chartOptions: Highcharts.Options = {
      chart: { type: barType },
      xAxis: { categories },
      yAxis: buildAxisOptions(yAxis, yPlotLines, [], 'right'),
      legend: { enabled: showLegend ?? series.length > 1 },
      plotOptions: {
        series: { stacking },
        column: { grouping: !stacking, borderRadius: 2 },
        bar: { grouping: !stacking, borderRadius: 2 },
      },
      tooltip: {
        useHTML: true,
        formatter() {
          const index = Number(this.x);
          const y = Number(this.y);
          const extra = tooltipExtra ? `<br/>${tooltipExtra(index, this.series.name, y)}` : '';
          const share = stacking === 'percent' && this.percentage !== undefined ? ` (${this.percentage.toFixed(1)} %)` : '';
          return `<b>${categories[index] ?? ''}</b><br/>${chartFormat.marker(this.color)} ${this.series.name}: <b>${chartFormat.value(y, yAxis.unit)}</b>${share}${extra}`;
        },
      },
      series: series.map((item) => ({
        type: item.type ?? barType,
        name: item.name,
        color: item.color,
        stack: item.stack,
        dashStyle: item.dashStyle,
        data: item.data,
      })) as Highcharts.SeriesOptionsType[],
    };

    const tableData: ChartTableData = {
      columns: ['', ...series.map((item) => chartFormat.axisTitle(item.name, yAxis.unit))],
      rows: categories.map((category, index) => [category, ...series.map((item) => pointValue(item.data[index] ?? null))]),
    };
    return { options: chartOptions, table: tableData };
  }, [categories, series, yAxis, horizontal, stacking, yPlotLines, showLegend, tooltipExtra]);

  return <ChartCard {...props} options={options} table={table} />;
}
