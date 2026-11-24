import type { CombustionMode } from '../../../types/combustion-mode.type';

export const COMBUSTION_MODES: ReadonlyArray<{ mode: CombustionMode; label: string; description: string }> = [
  { mode: 'solid-direct', label: 'Solid, one step', description: 'Solid fuel burnt in one step.' },
  { mode: 'solid-two-step', label: 'Solid, two steps', description: 'Generator gas from primary air, then burnout with secondary air.' },
  { mode: 'fluid', label: 'Gas / liquid', description: 'Gaseous fuel (preset or mole fractions) or liquid fuel (elemental analysis).' },
  { mode: 'bed', label: 'Packed bed', description: 'Packed bed solved layer by layer, then burnout with secondary air.' },
];
