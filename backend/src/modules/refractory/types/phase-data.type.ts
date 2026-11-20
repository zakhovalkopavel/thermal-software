import type { PhaseComponent } from './phase-component.type';

/** Liquid or solid phase data. */
export type PhaseData = {
  /** Phase percentage (0-100) */
  percent: number;

  /** Phase mass (kg) */
  mass: number;

  /** Phase composition (Record with component names and wt%) */
  composition: Record<string, number>;

  /** Active components in phase */
  components: PhaseComponent[];
};
