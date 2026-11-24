export type FixtureFile = {
  request: { method: string; path: string; params?: Record<string, unknown>; body?: unknown };
  status: number;
  data: unknown;
};
