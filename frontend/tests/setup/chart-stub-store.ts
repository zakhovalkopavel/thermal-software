import type Highcharts from 'highcharts';

/** Options received by every rendered chart stub, in render order. */
export const chartStub: { options: Highcharts.Options[] } = { options: [] };

export function resetChartStub() {
  chartStub.options = [];
}
