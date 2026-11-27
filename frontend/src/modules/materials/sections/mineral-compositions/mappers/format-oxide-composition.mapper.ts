import { formatValue } from '@/shared/ui/calc';

/** Compact oxide list sorted by descending wt%, e.g. `Al2O3 44.4 · SiO2 30.1 · CaO 23.0`. */
export function formatOxideComposition(composition: Record<string, number>, empty = '—'): string {
  const rows = Object.entries(composition)
    .filter(([, wt]) => wt > 0)
    .sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) return empty;
  return rows.map(([oxide, wt]) => `${oxide} ${formatValue(wt)}`).join(' · ');
}
