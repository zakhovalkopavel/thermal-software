/** Parses "110, 600, 800" into ascending °C values; throws with a user-facing message. */
export function parseTemperatureProfile(text: string): number[] {
  const parts = text
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) throw new Error('Enter at least one firing temperature.');
  const values = parts.map(Number);
  if (values.some((value) => !Number.isFinite(value))) throw new Error('Temperatures must be numbers separated by commas.');
  if (values.some((value, index) => index > 0 && value <= values[index - 1])) {
    throw new Error('Temperatures must be in ascending order.');
  }
  return values;
}
