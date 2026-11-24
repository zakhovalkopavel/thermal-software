import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { CorrelationInfo } from '../types/correlation-info.type';
import { toReValidityBand } from './re-validity-band.mapper';

const CORRELATIONS = recordedResponse<CorrelationInfo[]>('GET /thermodynamics/correlations');
const correlation = (name: string) => CORRELATIONS.find((item) => item.name === name)!;

describe('htc › re-validity-band', () => {
  it('clips the Re range to the swept values', () => {
    expect(toReValidityBand(correlation('gnielinski'), [1200, 12000, 48000])).toEqual([
      { from: 3000, to: 48000, label: 'gnielinski valid' },
    ]);
    expect(toReValidityBand(correlation('dittus_boelter'), [1200, 48000])).toEqual([
      { from: 10000, to: 48000, label: 'dittus_boelter valid' },
    ]);
  });

  it('is empty when the sweep misses the range', () => {
    expect(toReValidityBand(correlation('mills'), [5000, 9000])).toEqual([]);
    expect(toReValidityBand(correlation('mills'), [])).toEqual([]);
    expect(toReValidityBand(undefined, [100])).toEqual([]);
  });
});
