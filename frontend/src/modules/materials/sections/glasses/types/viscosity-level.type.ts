import type { GlassFixedPoints } from './glass-fixed-points.type';

export type ViscosityLevel = {
  key: Exclude<keyof GlassFixedPoints, 'spans' | 'flowPoint_C'>;
  label: string;
  /** log₁₀(η / Pa·s) */
  logEta: number;
};
