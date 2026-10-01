import type { CategorySeries } from '@/shared/ui/charts';
import type { CombustionSummary } from '../types/combustion-summary.type';

/** Stacked columns: [in, out] per flow; each flow is one series with a value in one column only. */
export function toMassBalanceSeries(summary: CombustionSummary): CategorySeries[] {
  const inputs = [{ label: 'Fuel', kgs: summary.mFuel_kgs }, ...summary.feeds].filter((flow) => flow.kgs > 0);
  const { mGas_kgs, charCarbon_kgs, ash_kgs } = summary.lastStep;
  const outputs = [
    { label: 'Flue gas', kgs: mGas_kgs },
    { label: 'Unburnt carbon', kgs: charCarbon_kgs },
    { label: 'Ash', kgs: ash_kgs },
  ].filter((flow) => flow.kgs > 0);
  return [
    ...inputs.map((flow) => ({ name: flow.label, data: [flow.kgs, null] })),
    ...outputs.map((flow) => ({ name: flow.label, data: [null, flow.kgs] })),
  ];
}
