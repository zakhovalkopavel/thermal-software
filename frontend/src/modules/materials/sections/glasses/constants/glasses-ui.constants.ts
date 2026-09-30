import type { GlassTaskState } from '../types/glass-task-state.type';

export const GLASSES_UI = {
  customPresetId: 'custom',
  defaultPresetId: 'soda_lime_glass',
  chartGrid: { from: 400, to: 1600, step: 20 },
  maxGridPoints: 301,
  sumMin: 99,
  sumMax: 101,
  viscosityAxis: { min: 1, max: 1e15 },
  viscosityChartHeight: 460,
  compositionChart: { baseHeight: 120, rowHeight: 56 },
  targetLogEtaMin: 0,
  targetLogEtaMax: 15,
  defaultTask: {
    task: 'at-temperature',
    temperature_C: 1200,
    from: 400,
    to: 1600,
    step: 20,
    targetLogEta: 3,
  } satisfies GlassTaskState,
} as const;
