import { useMemo } from 'react';
import { formatValue } from '../../../../../components/calc';
import { XYLineChart } from '../../../../../components/charts';
import type { ChartAxis, XYLineChartProps, XYSeries } from '../../../../../components/charts';
import { MIX_OPTION_LABELS } from '../constants/mix-option-labels.constants';
import { toCumulativePsd } from '../mappers/cumulative-psd.mapper';
import type { PsdChartsProps } from '../types/psd-charts-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = { title: 'Particle size d', unit: 'mm', type: 'logarithmic' };
const Y_AXES: ChartAxis[] = [{ title: 'Cumulative finer', unit: '%', min: 0, max: 100 }];

export function CumulativePsdChart({ fractions, andreasen, funkDinger }: PsdChartsProps) {
  const series = useMemo<XYSeries[]>(() => {
    const actual = toCumulativePsd(fractions, fractions.map((fraction) => fraction.massPercent));
    return [
      { name: 'Actual mix', data: actual, emphasis: true, showMarkers: true },
      ...(andreasen
        ? [{ name: `${MIX_OPTION_LABELS.psdMethod.Andreasen} (q = ${andreasen.q})`, data: toCumulativePsd(fractions, andreasen.massFractions), dashStyle: 'Dash' as const }]
        : []),
      ...(funkDinger
        ? [
            {
              name: `${MIX_OPTION_LABELS.psdMethod.FunkDinger} (q = ${funkDinger.q}, Dmin = ${formatValue(funkDinger.Dmin_mm)} mm)`,
              data: toCumulativePsd(fractions, funkDinger.massFractions),
              dashStyle: 'ShortDot' as const,
            },
          ]
        : []),
    ];
  }, [fractions, andreasen, funkDinger]);

  return <XYLineChart title="Cumulative PSD (CPFT)" subtitle="Logarithmic size axis" xAxis={X_AXIS} yAxes={Y_AXES} series={series} />;
}
