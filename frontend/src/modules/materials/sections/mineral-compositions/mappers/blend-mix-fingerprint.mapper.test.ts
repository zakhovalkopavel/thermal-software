import { describe, expect, it } from 'vitest';
import { CASTABLE_MIX_FRACTIONS } from '../../../../../../tests/fixtures/inputs/castable-mix-fractions';
import { toBlendMixFingerprint } from './blend-mix-fingerprint.mapper';

describe('mineral-compositions › blend-mix-fingerprint', () => {
  it('changes when a mass fraction changes', () => {
    const base = toBlendMixFingerprint(CASTABLE_MIX_FRACTIONS);
    const changed = toBlendMixFingerprint([
      { ...CASTABLE_MIX_FRACTIONS[0], massPercent: CASTABLE_MIX_FRACTIONS[0].massPercent - 5 },
      ...CASTABLE_MIX_FRACTIONS.slice(1),
    ]);
    expect(changed).not.toBe(base);
  });
});
