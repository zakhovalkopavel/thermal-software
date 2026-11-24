import { THERMAL_UI } from '../constants/thermal-ui.constants';

/** "30, 60, 120" → [30, 60, 120]; throws a user-facing message for invalid input. */
export function parseTauList(text: string): number[] {
  const values = text
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map(Number);
  if (values.length === 0) throw new Error('Enter at least one time.');
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) throw new Error('Times must be positive numbers.');
  if (values.length > THERMAL_UI.maxTauListLength) throw new Error(`Enter at most ${THERMAL_UI.maxTauListLength} times.`);
  return [...new Set(values)].sort((a, b) => a - b);
}
