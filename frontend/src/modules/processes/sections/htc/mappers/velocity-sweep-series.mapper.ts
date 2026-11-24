import type { VelocitySweepPoint } from '../types/velocity-sweep-point.type';

type Pair = [number, number];

export function toVelocitySweepSeries(points: VelocitySweepPoint[]): { h: Pair[]; re: Pair[] } {
  const solved = points.flatMap((point) => (point.result ? [{ w: point.w_m_s, result: point.result }] : []));
  return {
    h: solved.map(({ w, result }): Pair => [w, result.h_W_m2K]),
    re: solved.filter(({ result }) => result.Re > 0).map(({ w, result }): Pair => [w, result.Re]),
  };
}
