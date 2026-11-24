import { describe, expect, it } from 'vitest';
import { toSupply } from './supply-request.mapper';

describe('combustion › supply-request', () => {
  it('sends power or mass flow', () => {
    expect(toSupply({ basis: 'power', value: 20000 })).toEqual({ fPower_W: 20000 });
    expect(toSupply({ basis: 'mass', value: 0.001 })).toEqual({ mFuel_kgs: 0.001 });
  });

  it('names the missing value', () => {
    expect(() => toSupply({ basis: 'power', value: null })).toThrow('Enter the fuel power.');
    expect(() => toSupply({ basis: 'mass', value: null })).toThrow('Enter the fuel mass flow.');
  });
});
