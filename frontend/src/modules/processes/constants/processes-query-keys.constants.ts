export const PROCESSES_QUERY_KEYS = {
  fuels: ['processes', 'combustion', 'fuels'] as const,
  combustion: (mode: string, input: unknown) => ['processes', 'combustion', mode, input] as const,
  multilayerWall: (input: unknown) => ['processes', 'multilayer-wall', input] as const,
  calculation: (endpoint: string, input: unknown) => ['processes', endpoint, input] as const,
  catalogue: (name: string) => ['processes', 'catalogue', name] as const,
};
