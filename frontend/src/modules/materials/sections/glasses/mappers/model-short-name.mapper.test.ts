import { describe, expect, it } from 'vitest';
import { toModelShortName } from './model-short-name.mapper';

describe('glasses › model-short-name', () => {
  it('takes the text in the last parentheses', () => {
    expect(toModelShortName('VFT viscosity (soda-lime) (Fluegel 2007)')).toBe('Fluegel 2007');
  });

  it('returns the full name without trailing parentheses', () => {
    expect(toModelShortName('Hetherington 1964')).toBe('Hetherington 1964');
    expect(toModelShortName('Model (draft) v2')).toBe('Model (draft) v2');
  });
});
