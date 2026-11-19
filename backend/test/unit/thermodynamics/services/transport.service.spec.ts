import { TransportService } from '../../../../src/modules/thermodynamics/services/transport.service';
import { GasPropertiesService } from '../../../../src/modules/thermodynamics/services/gas-properties.service';
import { Species } from '../../../../src/modules/thermodynamics/enums/species.enum';
import { STANDARD_CONDITIONS } from '../../../../src/common/thermal/constants/standard-conditions.constants';
import { MIXTURE_THERMAL_CONDUCTIVITY } from '../../../../src/modules/thermodynamics/constants/mixture-thermal-conductivity.constants';
import { ChungThermalConductivity } from '../../../../src/modules/thermodynamics/utils/conductivity/chung-thermal-conductivity';
import { GasDensity } from '../../../../src/modules/thermodynamics/utils/density/gas-density';
import { GAS_REGISTRY } from '../../../../src/common/thermal/compound/gas/registry';

describe('TransportService mixture thermal conductivity', () => {
  const transport = new TransportService();
  const gasProps = new GasPropertiesService();
  const T = 300;
  const mole = { [Species.N2]: 0.79, [Species.O2]: 0.21 } as Partial<Record<Species, number>>;
  const cpBySp = {
    [Species.N2]: gasProps.cpSpecies(Species.N2, T),
    [Species.O2]: gasProps.cpSpecies(Species.O2, T),
  } as Partial<Record<Species, number>>;

  it('uses Hirschfelder–Eucken at atmospheric pressure', () => {
    const r = transport.thermalConductivityMixResult(
      mole, T, cpBySp, STANDARD_CONDITIONS.PRESSURE_PA,
    );
    expect(r.method).toBe('HirschfelderEucken');
    expect(r.value).toBeGreaterThan(0.02);
    expect(r.value).toBeLessThan(0.04);
    expect(r.validity.message).toMatch(/Hirschfelder/);
    expect(r.validity.message).toMatch(/GasDensity/);
  });

  it('uses Chung1988 when y ≥ Y_SWITCH (V from GasDensity)', () => {
    const mixParams = ChungThermalConductivity.mixParameters([
      ChungThermalConductivity.speciesParams({
        label: 'N2', y: 0.79, M: GAS_REGISTRY.N2.Mr,
        Tc: GAS_REGISTRY.N2.criticalTemperature,
        Vc: GAS_REGISTRY.N2.criticalVolume,
        omega: GAS_REGISTRY.N2.acentricFactor,
        dipole_C_m: GAS_REGISTRY.N2.dipoleMoment,
      }),
      ChungThermalConductivity.speciesParams({
        label: 'O2', y: 0.21, M: GAS_REGISTRY.O2.Mr,
        Tc: GAS_REGISTRY.O2.criticalTemperature,
        Vc: GAS_REGISTRY.O2.criticalVolume,
        omega: GAS_REGISTRY.O2.acentricFactor,
        dipole_C_m: GAS_REGISTRY.O2.dipoleMoment,
      }),
    ]);
    const V_switch = mixParams.Vc / (6 * MIXTURE_THERMAL_CONDUCTIVITY.Y_SWITCH);
    // Dense enough that Helmholtz/PR molar volume is below the switch threshold.
    const P_high = 2e7;
    const M = 0.79 * GAS_REGISTRY.N2.Mr + 0.21 * GAS_REGISTRY.O2.Mr;
    const V = M / GasDensity.forMixture(mole, T, P_high);
    expect(V).toBeLessThan(V_switch);

    const r = transport.thermalConductivityMixResult(mole, T, cpBySp, P_high);
    expect(r.method).toBe('Chung1988');
    expect(r.value).toBeGreaterThan(0);
    expect(r.validity.message).toMatch(/Chung1988/);
    expect(r.validity.message).toMatch(/GasDensity/);
  });

  it('throws when a component lacks critical properties', () => {
    const original = GAS_REGISTRY.N2.criticalTemperature;
    Object.defineProperty(GAS_REGISTRY.N2, 'criticalTemperature', {
      value: undefined,
      configurable: true,
    });
    try {
      expect(() => transport.thermalConductivityMixResult(
        { [Species.N2]: 1 }, T, { [Species.N2]: 29 }, STANDARD_CONDITIONS.PRESSURE_PA,
      )).toThrow(/criticalTemperature/);
    } finally {
      Object.defineProperty(GAS_REGISTRY.N2, 'criticalTemperature', {
        value: original,
        configurable: true,
      });
    }
  });
});

describe('TransportService pure NIST IR 8209 λ', () => {
  const transport = new TransportService();
  const gasProps = new GasPropertiesService();
  const T = 300;

  it('CO2 residual raises λ with pressure', () => {
    const Cp = gasProps.cpSpecies(Species.CO2, T);
    const low = transport.thermalConductivityResult(
      Species.CO2, T, Cp, STANDARD_CONDITIONS.PRESSURE_PA,
    );
    const high = transport.thermalConductivityResult(Species.CO2, T, Cp, 5e6);
    expect(high.value).toBeGreaterThan(low.value);
    expect(high.validity.message).toMatch(/NISTIR8209/);
  });

  it('H2 returns a physical dilute/residual λ at 300 K', () => {
    const Cp = gasProps.cpSpecies(Species.H2, T);
    const r = transport.thermalConductivityResult(
      Species.H2, T, Cp, STANDARD_CONDITIONS.PRESSURE_PA,
    );
    expect(r.value).toBeGreaterThan(0.1);
    expect(r.value).toBeLessThan(0.3);
  });
});

describe('TransportService Chapman–Enskog viscosity fallback', () => {
  const transport = new TransportService();

  it('uses CE LJ when viscosity.values is empty but LJ params exist', () => {
    const original = GAS_REGISTRY.N2.viscosity;
    Object.defineProperty(GAS_REGISTRY.N2, 'viscosity', {
      value: { def: 0, values: [] },
      configurable: true,
    });
    try {
      const r = transport.viscosityResult(Species.N2, 300);
      expect(r.value).toBeGreaterThan(1.5e-5);
      expect(r.value).toBeLessThan(2.1e-5);
      expect(r.validity.message).toMatch(/Chapman–Enskog/);
      expect(r.validity.message).toMatch(/Lennard-Jones/);
    } finally {
      Object.defineProperty(GAS_REGISTRY.N2, 'viscosity', {
        value: original,
        configurable: true,
      });
    }
  });

  it('uses CE Stockmayer when stockmayerDelta is set', () => {
    const originalVisc = GAS_REGISTRY.NH3.viscosity;
    const originalDelta = GAS_REGISTRY.NH3.stockmayerDelta;
    Object.defineProperty(GAS_REGISTRY.NH3, 'viscosity', {
      value: { def: 0, values: [] },
      configurable: true,
    });
    Object.defineProperty(GAS_REGISTRY.NH3, 'stockmayerDelta', {
      value: 0.65,
      configurable: true,
    });
    try {
      const r = transport.viscosityResult(Species.NH3, 300);
      expect(r.value).toBeGreaterThan(0);
      expect(r.validity.message).toMatch(/Stockmayer/);
    } finally {
      Object.defineProperty(GAS_REGISTRY.NH3, 'viscosity', {
        value: originalVisc,
        configurable: true,
      });
      Object.defineProperty(GAS_REGISTRY.NH3, 'stockmayerDelta', {
        value: originalDelta,
        configurable: true,
      });
    }
  });
});
