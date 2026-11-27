import type { MaterialMineralogyPhase } from './material-mineralogy-phase.type';

/** Typical XRD / grade mineralogy of a library mix component. */
export type MaterialMineralogy = {
  phases: MaterialMineralogyPhase[];
  /** Citation or short source note for the phase amounts */
  source: string;
};
