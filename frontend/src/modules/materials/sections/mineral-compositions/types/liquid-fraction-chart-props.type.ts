import type { PhaseEquilibriumResult } from './phase-equilibrium-result.type';

export type LiquidFractionChartProps = {
  points: { temperature: number; result?: PhaseEquilibriumResult }[];
};
