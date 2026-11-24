import { describe, expect, it } from 'vitest';
import { dimensionlessResult } from '../../../../../../tests/fixtures/inputs/dimensionless-result';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { CorrelationInfo } from '../types/correlation-info.type';
import { toReLimitPlotLines } from './re-limit-plot-lines.mapper';

const CORRELATIONS = recordedResponse<CorrelationInfo[]>('GET /thermodynamics/correlations');
const correlation = (name: string) => CORRELATIONS.find((item) => item.name === name)!;
const POINTS = [
  { w_m_s: 1, error: new Error('failed') },
  { w_m_s: 5, result: dimensionlessResult({ Re: 12000 }) },
];

describe('htc › re-limit-plot-lines', () => {
  it('converts both Re bounds to velocities', () => {
    expect(toReLimitPlotLines(POINTS, correlation('gnielinski'))).toMatchInlineSnapshot(`
      [
        {
          "dashStyle": "Dash",
          "label": "gnielinski: Re = 3000",
          "value": 1.25,
        },
        {
          "dashStyle": "Dash",
          "label": "gnielinski: Re = 5.000·10⁶",
          "value": 2083.3333333333335,
        },
      ]
    `);
  });

  it('skips a zero lower bound and an open upper bound', () => {
    expect(toReLimitPlotLines(POINTS, correlation('gnielinski_v2'))).toEqual([]);
  });

  it('is empty without a solved point or an Re range', () => {
    expect(toReLimitPlotLines([POINTS[0]], correlation('gnielinski'))).toEqual([]);
    expect(toReLimitPlotLines(POINTS, undefined)).toEqual([]);
  });
});
