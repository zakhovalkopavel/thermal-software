import { COMBUSTION_UI } from '../constants/combustion-ui.constants';

const DECIMALS = 2;

export function toExcessAirGrid(): number[] {
  const { from, to, step } = COMBUSTION_UI.excessAirSweep;
  const count = Math.round((to - from) / step) + 1;
  return Array.from({ length: count }, (_, index) => Number((from + index * step).toFixed(DECIMALS)));
}
