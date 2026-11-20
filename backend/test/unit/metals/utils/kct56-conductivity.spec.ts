import { Kct56Conductivity } from '../../../../src/modules/metals/utils/kct56-conductivity';
import { KCT56_CONDUCTIVITY_MODEL } from '../../../../src/modules/metals/data/kct56-conductivity.data';

describe('Kct56Conductivity', () => {
  it('matches fit check points within 1e-4 W/(m·K)', () => {
    expect(Kct56Conductivity.evaluate(0.05, 0)).toBeCloseTo(62.157609, 4);
    expect(Kct56Conductivity.evaluate(0.25, 100)).toBeCloseTo(50.697380, 4);
    expect(Kct56Conductivity.evaluate(0.435, 400)).toBeCloseTo(41.486900, 4);
    expect(Kct56Conductivity.evaluate(0.785, 800)).toBeCloseTo(24.739304, 4);
    expect(Kct56Conductivity.evaluate(1.1, 815)).toBeCloseTo(24.152273, 4);
  });

  it('evaluateKelvin matches evaluate at T_C = T_K − 273.15', () => {
    const T_K = 373.15;
    expect(Kct56Conductivity.evaluateKelvin(0.25, T_K)).toBeCloseTo(
      Kct56Conductivity.evaluate(0.25, 100),
      10,
    );
  });

  it('isInDomain respects model bounds', () => {
    expect(Kct56Conductivity.isInDomain(0.05, 0)).toBe(true);
    expect(Kct56Conductivity.isInDomain(1.1, 815)).toBe(true);
    expect(Kct56Conductivity.isInDomain(0.04, 100)).toBe(false);
    expect(Kct56Conductivity.isInDomain(0.5, 900)).toBe(false);
  });

  it('throws outside C or T domain', () => {
    expect(() => Kct56Conductivity.evaluate(0.01, 100)).toThrow(/outside/);
    expect(() => Kct56Conductivity.evaluate(0.5, 900)).toThrow(/outside/);
  });

  it('coefficient count matches degC × degT product', () => {
    const m = KCT56_CONDUCTIVITY_MODEL;
    expect(m.coef.length).toBe((m.degC + 1) * (m.degT + 1));
  });
});
