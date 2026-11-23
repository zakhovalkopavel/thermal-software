import { BadRequestException } from '@nestjs/common';
import { FluidPropertyService } from '../../../../src/modules/thermodynamics/services/fluid-property.service';
import { GasPropertiesService } from '../../../../src/modules/thermodynamics/services/gas-properties.service';
import { TransportService } from '../../../../src/modules/thermodynamics/services/transport.service';
import { CompoundFluidPropsService } from '../../../../src/modules/thermodynamics/services/compound-fluid-props.service';
import { Species } from '../../../../src/modules/thermodynamics/enums/species.enum';
import { FlowRegime } from '../../../../src/modules/thermodynamics/types/flow-regime.type';
import { STANDARD_CONDITIONS } from '../../../../src/common/thermal/constants/standard-conditions.constants';
import { FLUID_REGISTRY } from '../../../../src/common/thermal/compound/gas';

describe('FluidPropertyService', () => {
  let service: FluidPropertyService;

  beforeEach(() => {
    const gasProps = new GasPropertiesService();
    const transport = new TransportService();
    service = new FluidPropertyService(
      gasProps,
      transport,
      new CompoundFluidPropsService(gasProps, transport),
    );
  });

  describe('catalogues', () => {
    it('getFlowModes returns the five flow regimes', () => {
      const modes = service.getFlowModes();
      expect(modes.map((m) => m.key)).toEqual(
        expect.arrayContaining([
          FlowRegime.LAMINAR,
          FlowRegime.TURBULENT,
          FlowRegime.TRANSITIONAL,
          FlowRegime.NATURAL,
          FlowRegime.MIXED,
        ]),
      );
      expect(modes).toHaveLength(5);
    });

    it('getFluidList includes registry fluids and gas_mix', () => {
      const list = service.getFluidList();
      expect(list.some((e) => e.key === 'air')).toBe(true);
      expect(list.some((e) => e.key === 'gas_mix' && e.Mr_kg_mol === null)).toBe(true);
      expect(list.length).toBe(Object.keys(FLUID_REGISTRY).length + 1);
    });

    it('getGeometryList returns a non-empty catalogue', () => {
      const geos = service.getGeometryList();
      expect(geos.length).toBeGreaterThan(5);
      expect(geos[0]).toEqual(
        expect.objectContaining({
          key: expect.any(String),
          description: expect.any(String),
          requiredDims: expect.any(Array),
        }),
      );
    });

    it('getCorrelationList exposes geometries and optional Re/Pr/Ra bounds', () => {
      const list = service.getCorrelationList();
      expect(list.length).toBeGreaterThan(5);
      const withRe = list.find((c) => c.Re);
      expect(withRe?.geometry.length).toBeGreaterThan(0);
      expect(withRe!.Re![0]).toEqual(expect.any(Number));
    });
  });

  describe('getCp', () => {
    it('returns Cp/Cv/gamma for named air', () => {
      const res = service.getCp({ fluid: 'air', T_fluid_K: 300 });
      expect(res.Cp_J_kgK).toBeGreaterThan(900);
      expect(res.Cp_J_kgK).toBeLessThan(1100);
      expect(res.gamma).toBeGreaterThan(1.3);
      expect(res.gamma).toBeLessThan(1.5);
      expect(res.species).toBe('air');
      expect(res.T_K).toBe(300);
    });

    it('returns Cp for a gas_mix composition', () => {
      const res = service.getCp({
        fluid: 'gas_mix',
        T_fluid_K: 300,
        composition: { [Species.N2]: 0.79, [Species.O2]: 0.21 },
      });
      expect(res.Cp_J_kgK).toBeGreaterThan(900);
      expect(res.molecularWeight_kg_mol).toBeGreaterThan(0.028);
      expect(res.molecularWeight_kg_mol).toBeLessThan(0.03);
    });

    it('normalises composition that does not sum to 1', () => {
      const a = service.getCp({
        fluid: 'gas_mix',
        T_fluid_K: 400,
        composition: { [Species.N2]: 79, [Species.O2]: 21 },
      });
      const b = service.getCp({
        fluid: 'gas_mix',
        T_fluid_K: 400,
        composition: { [Species.N2]: 0.79, [Species.O2]: 0.21 },
      });
      expect(a.Cp_J_kgK).toBeCloseTo(b.Cp_J_kgK, 6);
    });
  });

  describe('getViscosity / getDensity / getThermalConductivity', () => {
    it('returns positive transport properties for named N2', () => {
      const mu = service.getViscosity({ fluid: 'N2', T_fluid_K: 300 });
      expect(mu.mu_Pa_s).toBeGreaterThan(1e-5);
      expect(mu.mu_Pa_s).toBeLessThan(3e-5);
      expect(mu.rho_kg_m3).toBeGreaterThan(0);
      expect(mu.nu_m2s).toBeCloseTo(mu.mu_Pa_s / mu.rho_kg_m3, 12);

      const rho = service.getDensity({
        fluid: 'N2',
        T_fluid_K: 300,
        P_Pa: STANDARD_CONDITIONS.PRESSURE_PA,
      });
      expect(rho.rho_kg_m3).toBeCloseTo(mu.rho_kg_m3, 5);
      expect(rho.P_Pa).toBe(STANDARD_CONDITIONS.PRESSURE_PA);

      const lam = service.getThermalConductivity({ fluid: 'N2', T_fluid_K: 300 });
      expect(lam.lambda).toBeGreaterThan(0.01);
      expect(lam.lambda).toBeLessThan(0.05);
    });

    it('returns mixture viscosity and conductivity for gas_mix', () => {
      const composition = { [Species.N2]: 0.79, [Species.O2]: 0.21 };
      const mu = service.getViscosity({ fluid: 'gas_mix', T_fluid_K: 300, composition });
      const lam = service.getThermalConductivity({
        fluid: 'gas_mix',
        T_fluid_K: 300,
        composition,
      });
      expect(mu.mu_Pa_s).toBeGreaterThan(1e-5);
      expect(lam.lambda).toBeGreaterThan(0.02);
    });
  });

  describe('validation', () => {
    it('requires T_fluid_K > 0', () => {
      expect(() => service.getCp({ fluid: 'air' } as any)).toThrow(BadRequestException);
      expect(() => service.getCp({ fluid: 'air', T_fluid_K: 0 })).toThrow(BadRequestException);
      expect(() => service.getCp({ fluid: 'air', T_fluid_K: -10 })).toThrow(BadRequestException);
    });

    it('rejects composition together with a named fluid', () => {
      expect(() =>
        service.getCp({
          fluid: 'air',
          T_fluid_K: 300,
          composition: { [Species.N2]: 1 },
        }),
      ).toThrow(BadRequestException);
    });

    it('rejects composition together with compoundId', () => {
      expect(() =>
        service.getCp({
          compoundId: 'N2',
          T_fluid_K: 300,
          composition: { [Species.N2]: 1 },
        } as any),
      ).toThrow(BadRequestException);
    });

    it('requires composition for gas_mix / absent fluid', () => {
      expect(() =>
        service.getCp({ fluid: 'gas_mix', T_fluid_K: 300 }),
      ).toThrow(BadRequestException);
      expect(() => service.getCp({ T_fluid_K: 300 } as any)).toThrow(BadRequestException);
    });

    it('rejects unknown named fluids', () => {
      expect(() =>
        service.getCp({ fluid: 'unobtainium', T_fluid_K: 300 }),
      ).toThrow(BadRequestException);
    });

    it('rejects fluid + compoundId both set to named species', () => {
      expect(() =>
        service.getCp({ fluid: 'N2', compoundId: 'O2', T_fluid_K: 300 } as any),
      ).toThrow(BadRequestException);
    });
  });
});

