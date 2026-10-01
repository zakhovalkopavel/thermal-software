import type { XYSeries } from '@/shared/ui/charts';
import { RAW_MATERIALS_UI } from '../constants/raw-materials-ui.constants';
import type { RawMaterialThermalPoint } from '../types/raw-material-thermal-point.type';

/** One series per material at the chosen porosity; with `includeDense`, a dashed P = 0 series per material that has one. */
export function toRawMaterialThermalSeries(
  points: RawMaterialThermalPoint[],
  names: Record<string, string>,
  property: 'lambda_WmK' | 'cp_JkgK',
  porosity: number,
  includeDense: boolean,
): XYSeries[] {
  const groups = new Map<string, { materialId: string; dense: boolean; points: RawMaterialThermalPoint[] }>();
  for (const point of points) {
    const dense = point.porosity !== porosity;
    if (dense && !includeDense) continue;
    const key = `${point.materialId}|${point.porosity}`;
    if (!groups.has(key)) groups.set(key, { materialId: point.materialId, dense, points: [] });
    groups.get(key)?.points.push(point);
  }

  return [...groups.values()].map((group) => {
    const name = names[group.materialId] ?? group.materialId;
    return {
      name: group.dense ? `${name} (P = ${RAW_MATERIALS_UI.densePorosity})` : name,
      dashStyle: group.dense ? 'Dash' : undefined,
      data: [...group.points]
        .sort((a, b) => a.temperature_C - b.temperature_C)
        .map((point) => [point.temperature_C, point[property]] as [number, number]),
    };
  });
}
