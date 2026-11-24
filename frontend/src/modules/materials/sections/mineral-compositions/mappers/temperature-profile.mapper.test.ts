import { describe, expect, it } from 'vitest';
import { parseTemperatureProfile } from './temperature-profile.mapper';

describe('mineral-compositions › temperature-profile', () => {
  it('accepts commas, semicolons and spaces', () => {
    expect(parseTemperatureProfile(' 110, 600;800  1400 ')).toEqual([110, 600, 800, 1400]);
  });

  it('rejects empty, non-numeric and unordered input', () => {
    expect(() => parseTemperatureProfile(' , ')).toThrow('Enter at least one firing temperature.');
    expect(() => parseTemperatureProfile('110, abc')).toThrow('Temperatures must be numbers separated by commas.');
    expect(() => parseTemperatureProfile('800, 600')).toThrow('Temperatures must be in ascending order.');
    expect(() => parseTemperatureProfile('600, 600')).toThrow('Temperatures must be in ascending order.');
  });
});
