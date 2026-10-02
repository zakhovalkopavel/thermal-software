import { ChemicalKineticsService } from '../../../../src/modules/combustion/services/chemical-kinetics.service';
import { BED_REACTIONS } from '../../../../src/modules/combustion/constants';
import { Species } from '../../../../src/modules/thermodynamics/enums';

describe('ChemicalKineticsService', () => {
  const k = new ChemicalKineticsService();
  const bed = { porosity: 0.45, activityFactor: 1 };
  const D = { O2: 2e-4, CO2: 1.6e-4, H2O: 2.4e-4 };
  const R_p = 0.01;

  it('Arrhenius constant grows with temperature', () => {
    const k1 = k.arrhenius(BED_REACTIONS.A.A1, BED_REACTIONS.E.E1, 1000);
    const k2 = k.arrhenius(BED_REACTIONS.A.A1, BED_REACTIONS.E.E1, 1200);
    expect(k2).toBeGreaterThan(k1);
    expect(k.arrhenius(5, 0, 900)).toBe(5);
  });

  it('effectiveness factor: 1 for small Thiele modulus or unknown D, <1 and ~3/φ for large φ', () => {
    expect(k.effectiveness(1e-12, 1e-4, 0.01)).toBe(1);
    expect(k.effectiveness(10, 0, 0.01)).toBe(1);
    const eta = k.effectiveness(1e4, 1e-5, 0.01);   // φ = 0.01·√1e9 ≈ 316
    const phi = 0.01 * Math.sqrt(1e4 / 1e-5);
    expect(eta).toBeLessThan(1);
    expect(eta).toBeCloseTo(3 / phi, 3);
    const mid = k.effectiveness(1, 1e-4, 0.01);       // φ = 1
    expect(mid).toBeGreaterThan(0.9);
    expect(mid).toBeLessThan(1);
  });

  it('kinetic temperature is the log-mean of gas and char temperatures', () => {
    expect(k.kineticTemperature(1000, 1000)).toBe(1000);
    const t = k.kineticTemperature(600, 1200);
    expect(t).toBeCloseTo(600 / Math.log(2), 9);
  });

  it('surface rates: positive in air, scale with the external surface a_s = 3(1−ε)/R_p', () => {
    const y = { [Species.O2]: 0.21, [Species.N2]: 0.79 };
    const r = k.surfaceRates(y, 1000, 1300, bed, D, R_p);
    expect(r.a_s).toBeCloseTo(3 * 0.55 / 0.01, 9);
    expect(r.r1).toBeGreaterThan(0);
    expect(r.r2).toBeGreaterThan(0);
    expect(r.r3).toBe(0);
    expect(r.r31).toBe(0);
    const hotter = k.surfaceRates(y, 1000, 1500, bed, D, R_p);
    expect(hotter.r1).toBeGreaterThan(r.r1);
    const inactive = k.surfaceRates(y, 1000, 1300, { ...bed, activityFactor: 0.5 }, D, R_p);
    expect(inactive.r1).toBeCloseTo(0.5 * r.r1, 12);
  });

  it('Boudouard rate follows the sign of pCO2 − pCO', () => {
    const fwd = k.surfaceRates({ [Species.CO2]: 0.2, [Species.CO]: 0.05, [Species.N2]: 0.75 }, 1200, 1200, bed, D, R_p);
    const rev = k.surfaceRates({ [Species.CO2]: 0.05, [Species.CO]: 0.2, [Species.N2]: 0.75 }, 1200, 1200, bed, D, R_p);
    expect(fwd.r3).toBeGreaterThan(0);
    expect(rev.r3).toBeLessThan(0);
  });

  it('water-gas shift net rate vanishes at equilibrium and changes sign across it', () => {
    const Kp = 1.5;
    const eq = { [Species.CO]: 0.1, [Species.H2O]: 0.1, [Species.CO2]: 0.15, [Species.H2]: 0.1, [Species.N2]: 0.55 };
    expect(k.gasPhaseRates(eq, 1100, Kp).r43).toBeCloseTo(0, 12);
    expect(k.gasPhaseRates(eq, 1100, 3).r43).toBeGreaterThan(0);
    expect(k.gasPhaseRates(eq, 1100, 1).r43).toBeLessThan(0);
  });

  it('gas-phase oxidation rates need both fuel gas and O2', () => {
    const r = k.gasPhaseRates({ [Species.CO]: 0.1, [Species.O2]: 0.05, [Species.N2]: 0.85 }, 1200, 1);
    expect(r.r4).toBeGreaterThan(0);
    expect(r.r41).toBe(0);
    expect(r.r42).toBe(0);
    expect(k.gasPhaseRates({ [Species.CO]: 0.1, [Species.N2]: 0.9 }, 1200, 1).r4).toBe(0);
  });

  it('surface heat release uses the legacy reaction heats (r2 per mol O2 → 2·ΔH2)', () => {
    const zero = { r1: 0, r2: 0, r3: 0, r31: 0, r32: 0, r33: 0 };
    expect(k.surfaceHeatRelease_W({ ...zero, r1: 1 })).toBeCloseTo(393500, 6);
    expect(k.surfaceHeatRelease_W({ ...zero, r2: 1 })).toBeCloseTo(221000, 6);
    expect(k.surfaceHeatRelease_W({ ...zero, r3: 1 })).toBeCloseTo(-172000, 6);
  });
});
