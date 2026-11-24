import type { GlassTask } from './glass-task.type';

export type GlassTaskState = {
  task: GlassTask;
  /** °C, task "at T" */
  temperature_C: number | null;
  /** °C, task "profile" */
  from: number | null;
  to: number | null;
  step: number | null;
  /** log₁₀(η / Pa·s), task "T at η" */
  targetLogEta: number | null;
};
