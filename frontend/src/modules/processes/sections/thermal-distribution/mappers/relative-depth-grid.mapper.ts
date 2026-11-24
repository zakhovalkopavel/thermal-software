/** Evenly spaced ξ from 0 (centre) to 1 (surface). */
export function toRelativeDepthGrid(points: number): number[] {
  return Array.from({ length: points }, (_, index) => index / (points - 1));
}
