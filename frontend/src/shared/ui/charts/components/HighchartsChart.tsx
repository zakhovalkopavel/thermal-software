import HighchartsReact from 'highcharts-react-official';
import Highcharts from '@/shared/ui/charts/config/highcharts';

type HighchartsChartProps = {
  options: Highcharts.Options;
};

export function HighchartsChart({ options }: HighchartsChartProps) {
  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
      updateArgs={[true, true, false]}
      containerProps={{ style: { width: '100%' } }}
    />
  );
}
