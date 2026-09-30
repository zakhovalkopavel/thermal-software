import { GasPropertiesService } from '../../../../src/modules/thermodynamics/services/gas-properties.service';
import { GAS_REGISTRY } from '../../../../src/common/thermal/compound/gas/registry';
import { Species } from '../../../../src/modules/thermodynamics/enums/species.enum';
import { compoundNasa7, compoundNasa9 } from '../../../../src/common/thermal/utils/nasa-database';
import { Nasa7EquationMethod } from '../../../../src/common/thermal/utils/nasa7-equation-method';
import { Nasa9EquationMethod } from '../../../../src/common/thermal/utils/nasa9-equation-method';

describe('GasPropertiesService — absolute enthalpy, entropy, Gibbs energy', () => {
  const gas = new GasPropertiesService();

  // NO/NO2 compound files carry older ΔHf values (≈1 kJ/mol below the NASA datasets)
  const tolerance_kJ = (sp: string): number => (sp === 'NO' || sp === 'NO2' ? 1.5 : 0.5);

  it('H, S, G come from NASA-9 when present, NASA-7 otherwise', () => {
    const n2 = compoundNasa9(GAS_REGISTRY['N2'])!.nasa9;
    const co2 = compoundNasa7(GAS_REGISTRY['CO2'])!.nasa7;
    const m9 = new Nasa9EquationMethod();
    const m7 = new Nasa7EquationMethod();
    expect(gas.absoluteEnthalpy(Species.N2, 1500)).toBeCloseTo(m9.enthalpy(1500, n2), 6);
    expect(gas.entropy(Species.N2, 1500)).toBeCloseTo(m9.entropy(1500, n2), 8);
    expect(gas.gibbsEnergy(Species.N2, 1500)).toBeCloseTo(m9.gibbsEnergy(1500, n2), 6);
    expect(gas.absoluteEnthalpy(Species.CO2, 1500)).toBeCloseTo(m7.enthalpy(1500, co2), 6);
  });

  it('cpSpecies default is NASA-9', () => {
    const n2 = compoundNasa9(GAS_REGISTRY['N2'])!.nasa9;
    expect(gas.cpSpecies(Species.N2, 1500)).toBeCloseTo(new Nasa9EquationMethod().calculate(1500, n2, 200, 20000), 10);
  });

  it.each([Species.N2, Species.CH4, Species.C3H8, Species.CO2])(
    'enthalpy(%s) is sensible: 0 at 298.15 K, = H_abs(T) − H_abs(298.15)',
    (sp) => {
      expect(Math.abs(gas.enthalpy(sp, 298.15))).toBeLessThan(1e-6);
      expect(gas.enthalpy(sp, 1200)).toBeCloseTo(gas.absoluteEnthalpy(sp, 1200) - gas.absoluteEnthalpy(sp, 298.15), 6);
    },
  );

  it.each(Object.keys(GAS_REGISTRY).filter(sp =>
    (GAS_REGISTRY[sp].nasa7Key || GAS_REGISTRY[sp].nasa9Key) && GAS_REGISTRY[sp].enthalpyFormation298 !== undefined))(
    'absoluteEnthalpy(%s, 298.15 K) equals enthalpyFormation298',
    (sp) => {
      const h = gas.absoluteEnthalpy(sp as Species, 298.15);
      expect(Math.abs(h - GAS_REGISTRY[sp].enthalpyFormation298!) / 1000).toBeLessThan(tolerance_kJ(sp));
    },
  );

  it('absoluteEnthalpy increases monotonically up to 6000 K and beyond (extrapolated)', () => {
    for (const sp of [Species.N2, Species.O2, Species.CO2, Species.CO, Species.H2O, Species.H2, Species.SO2]) {
      let prev = -Infinity;
      for (let T = 250; T <= 10_000; T += 250) {
        const h = gas.absoluteEnthalpy(sp, T);
        expect(h).toBeGreaterThan(prev);
        prev = h;
      }
    }
  });

  it('absoluteEnthalpy is continuous at the NASA-7 upper bound', () => {
    const below = gas.absoluteEnthalpy(Species.CO2, 6000 - 1e-6);
    const above = gas.absoluteEnthalpy(Species.CO2, 6000 + 1e-6);
    expect(Math.abs(above - below)).toBeLessThan(1e-2);
  });

  it('absoluteEnthalpyMixture is the mole-weighted sum', () => {
    const y = { [Species.CO2]: 0.2, [Species.N2]: 0.8 };
    const expected = 0.2 * gas.absoluteEnthalpy(Species.CO2, 1500) + 0.8 * gas.absoluteEnthalpy(Species.N2, 1500);
    expect(gas.absoluteEnthalpyMixture(y, 1500)).toBeCloseTo(expected, 6);
  });

  it('entropy at 298.15 K matches standard values (NIST)', () => {
    expect(gas.entropy(Species.CO2, 298.15)).toBeCloseTo(213.8, 0);
    expect(gas.entropy(Species.H2O, 298.15)).toBeCloseTo(188.8, 0);
    expect(gas.entropy(Species.SO2, 298.15)).toBeCloseTo(248.2, 0);
  });

  it('gibbsEnergy = H_abs − T·S', () => {
    for (const T of [500, 1200, 2500]) {
      const expected = gas.absoluteEnthalpy(Species.CO, T) - T * gas.entropy(Species.CO, T);
      expect(gas.gibbsEnergy(Species.CO, T)).toBeCloseTo(expected, 3);
    }
  });

  it('water-gas shift Kp from Gibbs energies matches literature (Kp(1100 K) ≈ 1)', () => {
    const Kp = (T: number): number => {
      const dG = gas.gibbsEnergy(Species.CO2, T) + gas.gibbsEnergy(Species.H2, T)
               - gas.gibbsEnergy(Species.CO, T) - gas.gibbsEnergy(Species.H2O, T);
      return Math.exp(-dG / (8.314462618 * T));
    };
    expect(Kp(1100)).toBeGreaterThan(0.8);
    expect(Kp(1100)).toBeLessThan(1.2);
    expect(Kp(600)).toBeGreaterThan(20);
    expect(Kp(1500)).toBeLessThan(0.5);
  });
});
