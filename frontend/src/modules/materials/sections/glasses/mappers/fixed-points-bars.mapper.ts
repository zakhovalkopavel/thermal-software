import { formatPowerOfTen } from '@/shared/ui/calc';
import type { CategorySeries } from '@/shared/ui/charts';
import { VISCOSITY_LEVELS } from '../constants/viscosity-levels.constants';
import type { GlassCurve } from '../types/glass-curve.type';
import type { GlassFixedPoints } from '../types/glass-fixed-points.type';

export function toFixedPointsBars(curves: GlassCurve[]): {
  categories: string[];
  series: CategorySeries[];
  spans: Record<string, GlassFixedPoints['spans']>;
  omitted: string[];
} {
  const withPoints = curves.filter((curve) => curve.profile?.fixedPoints);
  return {
    categories: VISCOSITY_LEVELS.map((level) => `${level.label} (${formatPowerOfTen(level.logEta)})`),
    series: withPoints.map((curve) => ({
      name: curve.name,
      data: VISCOSITY_LEVELS.map((level) => curve.profile?.fixedPoints?.[level.key] ?? null),
    })),
    spans: Object.fromEntries(withPoints.map((curve) => [curve.name, curve.profile?.fixedPoints?.spans])),
    omitted: curves.filter((curve) => curve.profile && !curve.profile.fixedPoints).map((curve) => curve.name),
  };
}
