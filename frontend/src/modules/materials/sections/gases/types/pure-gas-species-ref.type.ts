export type PureGasSpeciesRef =
  | { source: 'registry'; key: string; label: string }
  | { source: 'compound'; id: string; label: string };
