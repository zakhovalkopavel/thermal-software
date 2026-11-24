import { describe, expect, it } from 'vitest';
import { isModelSwapped } from './is-model-swapped.mapper';

describe('glasses › is-model-swapped', () => {
  it('is false when the applied model name contains the requested model', () => {
    expect(isModelSwapped('FLUEGEL_2007', 'VFT viscosity (Fluegel 2007)')).toBe(false);
  });

  it('is true when the backend applied a different model', () => {
    expect(isModelSwapped('LAKATOS_1976', 'VFT viscosity (Fluegel 2007)')).toBe(true);
  });

  it('is false when nothing was requested or applied', () => {
    expect(isModelSwapped(null, 'VFT viscosity (Fluegel 2007)')).toBe(false);
    expect(isModelSwapped('LAKATOS_1976', undefined)).toBe(false);
  });
});
