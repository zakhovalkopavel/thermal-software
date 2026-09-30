export const THERMAL_UI = {
  tabParam: 'tab',
  relDepth: { min: 0, max: 1, default: 0.5 },
  profilePoints: 21,
  /** Extra τ values [s] for the "profiles over time" chart. */
  defaultTauList: '30, 60, 120, 300, 600',
  maxTauListLength: 8,
  averageSweep: { minPoints: 2, maxPoints: 30, defaultPoints: 20, defaultTauMax_s: 600 },
} as const;
