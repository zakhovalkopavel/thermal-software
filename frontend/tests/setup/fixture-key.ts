/** `GET /metals/list` or `GET /metals/thermal-properties?T_K=500&material=steel` (query keys sorted). */
export function fixtureKey(method: string, path: string, params?: Record<string, unknown>): string {
  const query = Object.entries(params ?? {})
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : String(value)}`)
    .join('&');
  return `${method.toUpperCase()} ${path}${query ? `?${query}` : ''}`;
}
