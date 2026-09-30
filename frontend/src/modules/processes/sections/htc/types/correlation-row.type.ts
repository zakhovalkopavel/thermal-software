export type CorrelationRow = {
  name: string;
  Nu: number;
  /** h scaled from the used correlation: h_used · Nu / Nu_used (same λ and L). */
  h_W_m2K: number;
  rangeValid: boolean;
  warning?: string;
  used: boolean;
};
