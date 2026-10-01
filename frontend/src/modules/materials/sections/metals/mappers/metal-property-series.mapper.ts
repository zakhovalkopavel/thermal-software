import { CHART_THEME } from '@/shared/ui/charts';
import type { XYSeries } from '@/shared/ui/charts';
import { toClampedZones } from '../../../mappers/clamped-zones.mapper';
import type { MetalSummary } from '../../../types/metal-summary.type';
import type { MetalThermalResult } from '../types/metal-thermal-result.type';

/** λ series on axis 0 (solid) and ε series on axis 1 (dashed, dotted where clamped), one pair per grade. */
export function toMetalPropertySeries(
  byMaterial: Record<string, MetalThermalResult[]>,
  metals: MetalSummary[],
): XYSeries[] {
  return Object.entries(byMaterial).flatMap(([materialId, rows], index) => {
    const metal = metals.find((item) => item.materialId === materialId);
    const name = metal?.name ?? materialId;
    const color = CHART_THEME.colors[index % CHART_THEME.colors.length];
    const sorted = [...rows].sort((a, b) => a.T_K - b.T_K);
    return [
      {
        name: `λ — ${name}`,
        data: sorted.map((row) => [row.T_K, row.lambda_WmK] as [number, number]),
        color,
        yAxis: 0,
        unit: 'W/(m·K)',
      },
      {
        name: `ε — ${name}`,
        data: sorted.map((row) => [row.T_K, row.emissivity] as [number, number]),
        color,
        yAxis: 1,
        unit: '–',
        dashStyle: 'Dash',
        zones: metal ? toClampedZones(metal.emissivityRange_K, 'Dash') : undefined,
      },
    ];
  });
}
