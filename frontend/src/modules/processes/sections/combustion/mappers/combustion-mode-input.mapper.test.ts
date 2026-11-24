import { describe, expect, it } from 'vitest';
import { recordedResponse } from '../../../../../../tests/setup/recorded-response';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import { COMBUSTION_DEFAULTS } from '../constants/combustion-defaults.constants';
import { toCombustionModeInput } from './combustion-mode-input.mapper';
import { toCombustionRequest } from './combustion-request.mapper';

const FUELS = recordedResponse<FuelSummary[]>('GET /combustion/fuels');

describe('combustion › combustion-mode-input', () => {
  it.each([
    ['solid-direct', 'solidDirect'],
    ['solid-two-step', 'solidTwoStep'],
    ['fluid', 'fluid'],
    ['bed', 'bed'],
  ] as const)('puts the %s input under %s', (mode, key) => {
    const request = toCombustionRequest(mode, COMBUSTION_DEFAULTS, FUELS);
    expect(toCombustionModeInput(request)).toEqual({ mode, [key]: request.input });
  });
});
