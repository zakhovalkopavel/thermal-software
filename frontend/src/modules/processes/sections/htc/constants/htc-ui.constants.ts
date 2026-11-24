export const HTC_UI = {
  tabParam: 'tab',
  /** `fluid` value that tells the backend to use `composition`. */
  gasMixFluid: 'gas_mix',
  /** Named-fluid default; "air" fails in the dimensionless endpoint (no Sutherland parameters). */
  defaultNamedFluid: 'N2',
  sweep: { minPoints: 2, maxPoints: 25, defaultFrom_m_s: 0.5, defaultTo_m_s: 20, defaultPoints: 20 },
  correlationTableMaxHeight: 360,
} as const;
