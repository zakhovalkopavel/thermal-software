import { useMemo } from 'react';
import { ScatterChart } from '../../../../../components/charts';
import type { ChartAxis } from '../../../../../components/charts';
import { toBlendMapSeries } from '../mappers/blend-map-series.mapper';
import type { BlendResultMapChartProps } from '../types/blend-result-map-chart-props.type';

const X_AXIS: ChartAxis = { title: 'Water demand', unit: '%' };
const Y_AXIS: ChartAxis = { title: 'Packing efficiency' };

export function BlendResultMapChart({ results, bestBy, selectedId, onSelect }: BlendResultMapChartProps) {
  const series = useMemo(() => toBlendMapSeries(results), [results]);
  const highlightedIds = useMemo(() => [...new Set(bestBy.map((item) => item.id))], [bestBy]);
  return (
    <ScatterChart
      title="Result map"
      subtitle="Bubble size = green porosity (smaller is better); highlighted = best by a criterion; click a bubble to select it"
      xAxis={X_AXIS}
      yAxis={Y_AXIS}
      series={series}
      bubble
      zLabel="Green porosity, %"
      selectedId={selectedId}
      highlightedIds={highlightedIds}
      onPointClick={onSelect}
    />
  );
}
