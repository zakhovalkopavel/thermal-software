/** Mineral phase information (phase-equilibrium domain). */
export type MineralPhase = {
  /** Phase name (Mullite, Corundum, etc.) */
  phase: string;

  /** Chemical formula */
  formula: string;

  /** Estimated percentage in solid */
  percent: number;

  /** Melting point (°C) */
  meltingPoint: number;

  /** Physical description */
  description: string;
};
