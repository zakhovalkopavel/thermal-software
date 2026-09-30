import type { CompositionUnit } from '../../../../../components/calc';
import type { GlassModel } from './glass-model.type';
import type { GlassReference } from './glass-reference.type';
import type { GlassTask } from './glass-task.type';

export type GlassCalculationRequest = {
  /** In `unit`; converted to wt% before the viscosity calls when `unit` is mol. */
  composition: Record<string, number>;
  unit: CompositionUnit;
  model: GlassModel | null;
  task: GlassTask;
  temperature_C: number | null;
  targetLogEta: number | null;
  /** Chart grid, °C. */
  grid: number[];
  references: GlassReference[];
};
