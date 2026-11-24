import { VISCOSITY_LEVELS } from '../constants/viscosity-levels.constants';
import type { GlassFixedPoints } from '../types/glass-fixed-points.type';

/** (T, η) of the five fixed points; empty when the model gives no fixed points. */
export function toFixedPointMarkers(fixedPoints: GlassFixedPoints | null | undefined): [number, number][] {
  if (!fixedPoints) return [];
  return VISCOSITY_LEVELS.map((level) => [fixedPoints[level.key], Math.pow(10, level.logEta)]);
}
