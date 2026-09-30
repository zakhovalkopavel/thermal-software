/** Text in the last parentheses of the backend model name ("… (Fluegel 2007)" → "Fluegel 2007"), else the full name. */
export function toModelShortName(modelName: string): string {
  const match = /\(([^()]+)\)\s*$/.exec(modelName);
  return match ? match[1] : modelName;
}
