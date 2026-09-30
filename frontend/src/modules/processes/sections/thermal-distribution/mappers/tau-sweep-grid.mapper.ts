import { THERMAL_UI } from '../constants/thermal-ui.constants';

/** τ = τ_max·i/n for i = 1…n; τ = 0 is skipped because the Fourier series is inaccurate at Fo = 0. Throws for invalid input. */
export function toTauSweepGrid(tauMax: number | null, points: number | null): number[] {
  const { minPoints, maxPoints } = THERMAL_UI.averageSweep;
  if (tauMax === null || tauMax <= 0) throw new Error('Enter a positive end time.');
  if (points === null) throw new Error('Enter the number of points.');
  const count = Math.round(points);
  if (count < minPoints || count > maxPoints) throw new Error(`Use ${minPoints}–${maxPoints} points.`);
  return Array.from({ length: count }, (_, index) => (tauMax * (index + 1)) / count);
}
