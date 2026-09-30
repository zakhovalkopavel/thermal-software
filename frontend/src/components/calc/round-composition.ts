export function roundComposition(composition: Record<string, number>, decimals: number): Record<string, number> {
  return Object.fromEntries(
    Object.entries(composition).map(([key, value]) => [key, Number(value.toFixed(decimals))]),
  );
}
