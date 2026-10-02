/** Round to 6 significant figures and strip trailing zeros. */
export function formatSignificant(n: number): string {
  return String(parseFloat(n.toPrecision(6)));
}
