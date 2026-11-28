import { describe, expect, it } from 'vitest';
import { toWallPropertySeries } from './wall-property-series.mapper';

describe('recuperator › wall-property-series', () => {
  it('maps λ and ε against wall temperature in °C', () => {
    const series = toWallPropertySeries([
      { T_K: 373.15, lambda_WmK: 1.1, emissivity: 0.8 },
      { T_K: 1273.15, lambda_WmK: 1.4, emissivity: 0.85 },
    ]);
    expect(series).toHaveLength(2);
    expect(series[0]).toMatchObject({ name: 'λ', emphasis: true, unit: 'W/(m·K)' });
    expect(series[1]).toMatchObject({ name: 'ε', yAxis: 1, unit: '—' });
    expect(series[0].data[0][0]).toBeCloseTo(100);
    expect(series[0].data[1][0]).toBeCloseTo(1000);
    expect(series[0].data.map((point) => point[1])).toEqual([1.1, 1.4]);
    expect(series[1].data.map((point) => point[1])).toEqual([0.8, 0.85]);
  });
});
