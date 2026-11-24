/** Component information in phase. */
export type PhaseComponent = {
  /** Component name/formula */
  component: string;

  /** Weight percentage in phase */
  percentage: number;

  /** Component effect value (K) */
  effect?: number;
};
