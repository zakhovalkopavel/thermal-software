import { describe, expect, it } from 'vitest';
import { blendResult } from '../../../../../../tests/fixtures/inputs/blend-result';
import { toBlendResultId } from './blend-result-id.mapper';

describe('mineral-compositions › blend-result-id', () => {
  it('uses the rank', () => {
    expect(toBlendResultId(blendResult({ rank: 7 }))).toBe('7');
  });
});
