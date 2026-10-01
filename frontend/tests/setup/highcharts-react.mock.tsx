import type Highcharts from 'highcharts';
import { chartStub } from './chart-stub-store';

type ChartStubProps = { options: Highcharts.Options };

function ChartStub({ options }: ChartStubProps) {
  chartStub.options.push(options);
  const title = typeof options.title?.text === 'string' ? options.title.text : '';
  return <div data-testid="chart" data-title={title} />;
}

export default ChartStub;
