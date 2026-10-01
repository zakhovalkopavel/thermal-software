import type { XYSeries } from '@/shared/ui/charts';
import type { GlassCurve } from '../types/glass-curve.type';
import { toModelShortName } from './model-short-name.mapper';

/** η(T) series; y = 10^logViscosity (the backend rounds `viscosity_Pas`). User glass solid and thick, references dashed. */
export function toViscositySeries(curves: GlassCurve[]): XYSeries[] {
  return curves.flatMap((curve): XYSeries[] => {
    if (!curve.profile) return [];
    const model = toModelShortName(curve.profile.model);
    return [
      {
        name: `${curve.name} — ${model}${curve.swapped ? ' ⚠ substituted' : ''}`,
        emphasis: curve.isUser,
        dashStyle: curve.isUser ? undefined : 'Dash',
        data: curve.profile.points.map((point) => [point.temperature_C, Math.pow(10, point.logViscosity)]),
      },
    ];
  });
}
