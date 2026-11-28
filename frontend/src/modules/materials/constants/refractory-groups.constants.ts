/** Display order: Insulation → refractory families → Other (appended by the groups mapper). */
export const REFRACTORY_GROUPS = [
  { key: 'insulation', label: 'Insulation', idPrefixes: ['basalt_'], color: '#2e7d32' },
  { key: 'chamotte', label: 'Chamotte', idPrefixes: ['chamotte_'], color: '#b0532b' },
  { key: 'mullite', label: 'Mullite', idPrefixes: ['mullite_'], color: '#7b1fa2' },
  { key: 'quartz', label: 'Quartz', idPrefixes: ['quartz_'], color: '#f9a825' },
  { key: 'alumina', label: 'Alumina', idPrefixes: ['alumina_'], color: '#1565c0' },
  { key: 'carbide', label: 'Carbide', idPrefixes: ['silicon_carbide'], color: '#424242' },
] as const;
