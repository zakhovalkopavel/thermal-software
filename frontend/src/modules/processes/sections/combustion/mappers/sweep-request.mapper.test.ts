import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import { COMBUSTION_DEFAULTS } from '../constants/combustion-defaults.constants';
import { toCombustionRequest } from './combustion-request.mapper';
import { withExcessAir } from './sweep-request.mapper';

const FUELS = recordedResponse<FuelSummary[]>('GET /combustion/fuels');

describe('combustion › sweep-request', () => {
  it.each(['solid-direct', 'solid-two-step', 'fluid'] as const)('replaces λ in a %s request and keeps the rest', (mode) => {
    const request = toCombustionRequest(mode, COMBUSTION_DEFAULTS, FUELS);
    expect(withExcessAir(request, 1.75)).toEqual({ mode, input: { ...request.input, kExcessAir: 1.75 } });
  });

  it('does not sweep the bed mode', () => {
    expect(withExcessAir(toCombustionRequest('bed', COMBUSTION_DEFAULTS, FUELS), 1.75)).toBeNull();
  });
});
