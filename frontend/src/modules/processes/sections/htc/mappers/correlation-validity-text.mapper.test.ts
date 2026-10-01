import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { CorrelationInfo } from '../types/correlation-info.type';
import { toValidityText } from './correlation-validity-text.mapper';

const CORRELATIONS = recordedResponse<CorrelationInfo[]>('GET /thermodynamics/correlations');
const correlation = (name: string) => CORRELATIONS.find((item) => item.name === name)!;

describe('htc › correlation-validity-text', () => {
  it('lists the ranges the backend gives', () => {
    expect(toValidityText(correlation('gnielinski'))).toMatchInlineSnapshot(`"Re 3000 – 5.000·10⁶, Pr 0.5 – 2000"`);
    expect(toValidityText(correlation('mikheev'))).toMatchInlineSnapshot(`"Re 10000 – ∞"`);
  });

  it('is empty without ranges', () => {
    expect(toValidityText({ name: 'custom', geometry: [] })).toBe('');
  });
});
