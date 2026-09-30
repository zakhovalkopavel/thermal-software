import type { ViscosityLevel } from '../types/viscosity-level.type';

/** Standard viscosity reference levels (ASTM C965 / C338 / C336), as used by the backend fixed points. */
export const VISCOSITY_LEVELS: ViscosityLevel[] = [
  { key: 'meltingPoint_C', label: 'Melting', logEta: 1 },
  { key: 'workingPoint_C', label: 'Working', logEta: 3 },
  { key: 'softeningPoint_C', label: 'Softening', logEta: 6.6 },
  { key: 'annealingPoint_C', label: 'Annealing', logEta: 12 },
  { key: 'strainPoint_C', label: 'Strain', logEta: 13.5 },
];
