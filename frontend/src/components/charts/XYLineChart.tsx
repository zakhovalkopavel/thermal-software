import { useMemo } from 'react';
import type Highcharts from 'highcharts';
import { buildAxisOptions } from './build-axis-options';
import { chartFormat } from './chart.format';
import { CHART_THEME } from './chart.theme';
import { ChartCard } from './ChartCard';
import type { ChartTableData } from './types/chart-table-data.type';
import type { XYLineChartProps } from './types/xy-line-chart-props.type';

const MARKER_POINT_LIMIT = 25;

type SeriesCustom = { unit?: string };

export function XYLineChart(props: XYLineChartProps) {
  const { xAxis, yAxes, series, xPlotLines, yPlotLines, xPlotBands, markers = [], tooltipPointExtra } = props;

  const { options, table } = useMemo(() => {
    const xLog = xAxis.type === 'logarithmic';
    const yLog = (index = 0) => yAxes[index]?.type === 'logarithmic';
    const valid = (points: [number, number][], axisIndex?: number) =>
      points.filter(
        ([x, y]) => Number.isFinite(x) && Number.isFinite(y) && (!xLog || x > 0) && (!yLog(axisIndex) || y > 0),
      );
    const unitOf = (axisIndex = 0, unit?: string) => unit ?? yAxes[axisIndex]?.unit;

    const lineSeries: Highcharts.SeriesOptionsType[] = series.map((item) => ({
      type: 'line',
      name: item.name,
      data: valid(item.data, item.yAxis),
      color: item.color,
      dashStyle: item.dashStyle,
      yAxis: item.yAxis ?? 0,
      lineWidth: item.emphasis ? CHART_THEME.emphasisLineWidth : CHART_THEME.lineWidth,
      zIndex: item.emphasis ? 3 : 1,
      ...(item.zones ? { zoneAxis: 'x' as const, zones: item.zones } : {}),
      step: item.step,
      marker: { enabled: item.showMarkers ?? item.data.length <= MARKER_POINT_LIMIT, radius: 3 },
      custom: { unit: unitOf(item.yAxis, item.unit) } satisfies SeriesCustom,
    }));

    const markerSeries: Highcharts.SeriesOptionsType[] = markers.map((marker) => ({
      type: 'scatter',
      name: marker.name,
      data: valid(marker.points, marker.yAxis),
      color: marker.color ?? CHART_THEME.textColor,
      yAxis: marker.yAxis ?? 0,
      zIndex: 5,
      marker: { symbol: 'diamond', radius: 6 },
      custom: { unit: unitOf(marker.yAxis) } satisfies SeriesCustom,
    }));

    const chartOptions: Highcharts.Options = {
      chart: { type: 'line' },
      xAxis: { ...buildAxisOptions(xAxis, xPlotLines, xPlotBands), gridLineWidth: 1 },
      yAxis: yAxes.map((axis, index) => buildAxisOptions(axis, index === 0 ? yPlotLines : [], [], 'right')),
      legend: { enabled: series.length + markers.length > 1 },
      tooltip: {
        shared: true,
        useHTML: true,
        formatter() {
          const x = Number(this.x);
          const extra = xAxis.tooltipExtra ? ` (${xAxis.tooltipExtra(x)})` : '';
          const points = this.points ?? [this];
          const lines = points.map((point) => {
            const y = Number(point.y);
            const unit = (point.series.options.custom as SeriesCustom | undefined)?.unit;
            const pointExtra = tooltipPointExtra ? ` ${tooltipPointExtra(y, point.series.name)}` : '';
            return `${chartFormat.marker(point.color)} ${point.series.name}: <b>${chartFormat.value(y, unit)}</b>${pointExtra}`;
          });
          return [`<b>${xAxis.title}: ${chartFormat.value(x, xAxis.unit)}</b>${extra}`, ...lines].join('<br/>');
        },
      },
      series: [...lineSeries, ...markerSeries],
    };

    const xs = [...new Set(series.flatMap((item) => item.data.map(([x]) => x)))].sort((a, b) => a - b);
    const lookup = series.map((item) => new Map(item.data.map(([x, y]) => [x, y])));
    const tableData: ChartTableData = {
      columns: [
        chartFormat.axisTitle(xAxis.title, xAxis.unit),
        ...series.map((item) => chartFormat.axisTitle(item.name, unitOf(item.yAxis, item.unit))),
      ],
      rows: xs.map((x) => [x, ...lookup.map((map) => map.get(x) ?? null)]),
    };

    return { options: chartOptions, table: tableData };
  }, [xAxis, yAxes, series, xPlotLines, yPlotLines, xPlotBands, markers, tooltipPointExtra]);

  return <ChartCard {...props} options={options} table={table} />;
}
