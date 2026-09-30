import { useMemo } from 'react';
import type Highcharts from 'highcharts';
import { buildAxisOptions } from './build-axis-options';
import { chartFormat } from './chart.format';
import { CHART_THEME } from './chart.theme';
import { ChartCard } from './ChartCard';
import type { ChartTableData } from './types/chart-table-data.type';
import type { ScatterChartProps } from './types/scatter-chart-props.type';

const SELECTED_LINE_WIDTH = 3;
const HIGHLIGHT_LINE_WIDTH = 2;
const HIGHLIGHT_COLOR = '#ffb300';

export function ScatterChart(props: ScatterChartProps) {
  const { xAxis, yAxis, series, bubble, zLabel = 'Size', selectedId, highlightedIds = [], onPointClick } = props;

  const { options, table } = useMemo(() => {
    const seriesType = bubble ? 'bubble' : 'scatter';
    const chartOptions: Highcharts.Options = {
      chart: { type: seriesType },
      xAxis: { ...buildAxisOptions(xAxis), gridLineWidth: 1 },
      yAxis: buildAxisOptions(yAxis),
      legend: { enabled: series.length > 1 },
      tooltip: {
        useHTML: true,
        formatter() {
          const options = this.options as { label?: string; z?: number };
          const lines = [
            `<b>${options.label ?? this.series.name}</b>`,
            `${xAxis.title}: ${chartFormat.value(Number(this.x), xAxis.unit)}`,
            `${yAxis.title}: ${chartFormat.value(Number(this.y), yAxis.unit)}`,
          ];
          if (bubble && options.z !== undefined) lines.push(`${zLabel}: ${chartFormat.value(options.z)}`);
          return lines.join('<br/>');
        },
      },
      plotOptions: {
        series: {
          cursor: onPointClick ? 'pointer' : undefined,
          point: {
            events: {
              click() {
                if (onPointClick && this.options.id) onPointClick(String(this.options.id));
              },
            },
          },
        },
        bubble: { minSize: 8, maxSize: 36 },
      },
      series: series.map((item) => ({
        type: seriesType,
        name: item.name,
        color: item.color,
        data: item.data.map((point) => {
          const selected = point.id === selectedId;
          const highlighted = highlightedIds.includes(point.id);
          return {
            id: point.id,
            x: point.x,
            y: point.y,
            z: point.z,
            label: point.label,
            ...(selected || highlighted
              ? {
                  marker: {
                    lineWidth: selected ? SELECTED_LINE_WIDTH : HIGHLIGHT_LINE_WIDTH,
                    lineColor: selected ? CHART_THEME.textColor : HIGHLIGHT_COLOR,
                  },
                }
              : {}),
          };
        }),
      })) as Highcharts.SeriesOptionsType[],
    };

    const tableData: ChartTableData = {
      columns: [
        'Point',
        chartFormat.axisTitle(xAxis.title, xAxis.unit),
        chartFormat.axisTitle(yAxis.title, yAxis.unit),
        ...(bubble ? [zLabel] : []),
      ],
      rows: series.flatMap((item) =>
        item.data.map((point) => [point.label ?? item.name, point.x, point.y, ...(bubble ? [point.z ?? null] : [])]),
      ),
    };
    return { options: chartOptions, table: tableData };
  }, [xAxis, yAxis, series, bubble, zLabel, selectedId, highlightedIds, onPointClick]);

  return <ChartCard {...props} options={options} table={table} />;
}
