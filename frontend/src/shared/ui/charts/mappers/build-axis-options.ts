import type Highcharts from 'highcharts';
import { chartFormat } from './chart.format';
import { CHART_THEME } from '@/shared/ui/charts/config/chart.theme';
import type { ChartAxis } from '@/shared/ui/charts/types/chart-axis.type';
import type { PlotBand } from '@/shared/ui/charts/types/plot-band.type';
import type { PlotLine } from '@/shared/ui/charts/types/plot-line.type';

export function buildAxisOptions(
  axis: ChartAxis,
  plotLines: PlotLine[] = [],
  plotBands: PlotBand[] = [],
  labelAlign: 'left' | 'right' = 'left',
): Highcharts.XAxisOptions & Highcharts.YAxisOptions {
  const logarithmic = axis.type === 'logarithmic';
  return {
    type: logarithmic ? 'logarithmic' : 'linear',
    min: axis.min,
    max: axis.max,
    opposite: axis.opposite,
    title: { text: chartFormat.axisTitle(axis.title, axis.unit) },
    ...(logarithmic
      ? {
          minorTickInterval: 0.1,
          labels: {
            formatter() {
              return chartFormat.logTick(Number(this.value));
            },
          },
        }
      : {}),
    plotLines: plotLines.map((line) => ({
      value: line.value,
      color: line.color ?? CHART_THEME.mutedColor,
      dashStyle: line.dashStyle ?? 'Dash',
      width: 1,
      zIndex: 4,
      label: {
        text: line.label,
        align: labelAlign,
        style: { fontSize: '10px', color: CHART_THEME.mutedColor },
      },
    })),
    plotBands: plotBands.map((band) => ({
      from: band.from,
      to: band.to,
      color: band.color ?? CHART_THEME.bandColor,
      label: { text: band.label, style: { fontSize: '10px', color: CHART_THEME.mutedColor } },
    })),
  };
}
