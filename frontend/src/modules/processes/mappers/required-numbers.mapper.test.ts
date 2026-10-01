import { describe, expect, it } from 'vitest';
import { assertRequiredNumbers } from './required-numbers.mapper';

const FIELDS = [
  { key: 'T_K', label: 'Temperature', required: true },
  { key: 'P_Pa', label: 'Pressure' },
] as const;

describe('processes › required-numbers', () => {
  it('passes when every required field has a value', () => {
    expect(() => assertRequiredNumbers(FIELDS, { T_K: 300, P_Pa: null })).not.toThrow();
  });

  it('names the first empty required field', () => {
    expect(() => assertRequiredNumbers(FIELDS, { T_K: null, P_Pa: 101325 })).toThrow('Enter Temperature.');
  });
});
