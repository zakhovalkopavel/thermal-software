import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import { COMBUSTION_DEFAULTS } from '../constants/combustion-defaults.constants';
import { toCombustionRequest } from './combustion-request.mapper';
import { toRequestExcessAir } from './excess-air-of-request.mapper';

const FUELS = recordedResponse<FuelSummary[]>('GET /combustion/fuels');

describe('combustion › excess-air-of-request', () => {
  it('reads λ from the request', () => {
    expect(toRequestExcessAir(toCombustionRequest('fluid', COMBUSTION_DEFAULTS, FUELS))).toBe(1.1);
    expect(toRequestExcessAir(toCombustionRequest('bed', COMBUSTION_DEFAULTS, FUELS))).toBe(1.3);
  });
});
