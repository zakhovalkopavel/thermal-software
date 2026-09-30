export function pickOxides(
  composition: Record<string, number>,
  allowed: readonly string[],
): { kept: Record<string, number>; ignored: Record<string, number> } {
  const kept: Record<string, number> = {};
  const ignored: Record<string, number> = {};
  for (const [key, value] of Object.entries(composition)) {
    if (allowed.includes(key)) kept[key] = value;
    else ignored[key] = value;
  }
  return { kept, ignored };
}
