import { CHART_THEME } from '@/shared/ui/charts';
import type { XYSeries } from '@/shared/ui/charts';
import { toClampedZones } from '../../../mappers/clamped-zones.mapper';
import type { MetalSummary } from '../../../types/metal-summary.type';
import type { MetalResultProperty } from '../constants/metal-result-properties.constants';
import { metalResultValue } from '../constants/metal-result-properties.constants';
import type { MetalThermalResult } from '../types/metal-thermal-result.type';

/** One series per grade for the selected property (ε uses clamp zones when a range exists). */
export function toMetalPropertySeries(
  byMaterial: Record<string, MetalThermalResult[]>,
  metals: MetalSummary[],
  property: MetalResultProperty,
  toX: (T_K: number) => number = (T_K) => T_K,
): XYSeries[] {
  return Object.entries(byMaterial).flatMap(([materialId, rows], index) => {
    const metal = metals.find((item) => item.materialId === materialId);
    const name = metal?.name ?? materialId;
    const color = CHART_THEME.colors[index % CHART_THEME.colors.length];
    const data = [...rows]
      .sort((a, b) => a.T_K - b.T_K)
      .flatMap((row) => {
        const value = metalResultValue(row, property.key);
        return value === undefined ? [] : [[toX(row.T_K), value] as [number, number]];
      });
    if (data.length === 0) return [];
    return [
      {
        name: `${property.short} — ${name}`,
        data,
        color,
        yAxis: 0,
        unit: property.unit,
        ...(property.key === 'emissivity'
          ? {
              dashStyle: 'Dash' as const,
              zones: toClampedZones(metal?.emissivityRange_K, 'Dash', toX),
            }
          : {}),
      },
    ];
  });
}
