/** Cumulative % finer at each fraction's dMax (fractions sorted by size), starting at 0 % at the finest dMin when it is > 0. */
export function toCumulativePsd(fractions: { dMin_mm: number; dMax_mm: number }[], massFractions: number[]): [number, number][] {
  const items = fractions
    .map((fraction, index) => ({ ...fraction, mass: massFractions[index] ?? 0 }))
    .sort((a, b) => a.dMax_mm - b.dMax_mm || a.dMin_mm - b.dMin_mm);
  const total = items.reduce((sum, item) => sum + item.mass, 0);
  if (items.length === 0 || total <= 0) return [];

  const points: [number, number][] = items[0].dMin_mm > 0 ? [[items[0].dMin_mm, 0]] : [];
  let cumulative = 0;
  for (const item of items) {
    cumulative += item.mass;
    const y = (100 * cumulative) / total;
    const last = points[points.length - 1];
    if (last && last[0] === item.dMax_mm) last[1] = y;
    else points.push([item.dMax_mm, y]);
  }
  return points;
}
