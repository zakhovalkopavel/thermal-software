import type { MixFraction } from './mix-fraction.type';

export type MixAction =
  | { type: 'add' }
  | { type: 'update'; id: string; patch: Partial<Omit<MixFraction, 'id'>> }
  | { type: 'remove'; id: string }
  | { type: 'normalize' }
  | { type: 'setPacking'; phi: number | null; porosity: number | null }
  /** Mass % per fraction id; fractions not listed keep their value. */
  | { type: 'applyMassPercents'; massPercents: Record<string, number> };
