import { describe, expect, it } from 'vitest';
import { dimensionlessResult } from '../../../../../../tests/fixtures/inputs/dimensionless-result';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { CorrelationInfo } from '../types/correlation-info.type';
import { toCorrelationWarnings } from './correlation-warnings.mapper';

const CORRELATIONS = recordedResponse<CorrelationInfo[]>('GET /thermodynamics/correlations');
const correlation = (name: string) => CORRELATIONS.find((item) => item.name === name)!;

describe('htc › correlation-warnings', () => {
  it('is empty inside the validity ranges', () => {
    expect(toCorrelationWarnings(correlation('gnielinski'), dimensionlessResult())).toEqual([]);
  });

  it('warns for each value outside its range', () => {
    expect(toCorrelationWarnings(correlation('gnielinski'), dimensionlessResult({ Re: 1500, Pr: 0.3 }))).toMatchInlineSnapshot(`
      [
        "Re = 1500 is outside the validity range of gnielinski (3000 – 5.000·10⁶).",
        "Pr = 0.3 is outside the validity range of gnielinski (0.5 – 2000).",
      ]
    `);
  });

  it('is empty without a known correlation', () => {
    expect(toCorrelationWarnings(undefined, dimensionlessResult())).toEqual([]);
  });
});
