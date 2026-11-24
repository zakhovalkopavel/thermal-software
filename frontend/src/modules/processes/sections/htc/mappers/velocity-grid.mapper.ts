import { HTC_UI } from '../constants/htc-ui.constants';
import type { VelocitySweepDraft } from '../types/velocity-sweep-draft.type';

/** Throws a user-facing message for an invalid range. Velocities stay > 0 so Re fits a log axis. */
export function toVelocityGrid(sweep: VelocitySweepDraft): number[] {
  const { from_m_s, to_m_s, points } = sweep;
  const { minPoints, maxPoints } = HTC_UI.sweep;
  if (from_m_s === null || to_m_s === null || points === null) throw new Error('Enter the velocity range and the number of points.');
  if (from_m_s <= 0 || to_m_s <= from_m_s) throw new Error('Velocities must satisfy 0 < from < to.');
  const count = Math.round(points);
  if (count < minPoints || count > maxPoints) throw new Error(`Use ${minPoints}–${maxPoints} points.`);
  const step = (to_m_s - from_m_s) / (count - 1);
  return Array.from({ length: count }, (_, index) => from_m_s + index * step);
}
