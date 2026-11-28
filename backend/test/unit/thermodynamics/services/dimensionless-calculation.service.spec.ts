import { DimensionlessCalculationService } from '../../../../src/modules/thermodynamics/services/dimensionless-calculation.service';
import { DimensionlessNumbersService } from '../../../../src/modules/thermodynamics/services/dimensionless-numbers.service';
import { GasPropertiesService } from '../../../../src/modules/thermodynamics/services/gas-properties.service';
import { TransportService } from '../../../../src/modules/thermodynamics/services/transport.service';
import { CompoundFluidPropsService } from '../../../../src/modules/thermodynamics/services/compound-fluid-props.service';
import { FlowGeometry } from '../../../../src/modules/thermodynamics/enums/flow-geometry.enum';
import { FluidPhase } from '../../../../src/modules/thermodynamics/enums/fluid-phase.enum';
import { Species } from '../../../../src/modules/thermodynamics/enums/species.enum';
import { STANDARD_CONDITIONS } from '../../../../src/common/thermal/constants/standard-conditions.constants';

describe('DimensionlessCalculationService', () => {
  let service: DimensionlessCalculationService;

  beforeEach(() => {
    const gasProps = new GasPropertiesService();
    const transport = new TransportService();
    const numbers = new DimensionlessNumbersService();
    service = new DimensionlessCalculationService(
      gasProps,
      transport,
      numbers,
      new CompoundFluidPropsService(gasProps, transport),
    );
  });

  describe('resolveFluid', () => {
    it('resolves named air at 300 K', () => {
      const fluid = service.resolveFluid({ fluid: 'air', T_fluid_K: 300 });
      expect(fluid).not.toBeNull();
      expect(fluid!.rho_kg_m3).toBeGreaterThan(1);
      expect(fluid!.mu_Pa_s).toBeGreaterThan(1e-5);
      expect(fluid!.Cp_J_kgK).toBeGreaterThan(900);
      expect(fluid!.lambda).toBeGreaterThan(0.02);
      expect(fluid!.nu_m2s).toBeCloseTo(fluid!.mu_Pa_s / fluid!.rho_kg_m3, 10);
    });

    it('resolves a mole-fraction mixture', () => {
      const fluid = service.resolveFluid({
        fluid: 'gas_mix',
        T_fluid_K: 300,
        composition: { [Species.N2]: 0.79, [Species.O2]: 0.21 },
      });
      expect(fluid).not.toBeNull();
      expect(fluid!.rho_kg_m3).toBeGreaterThan(1);
    });

    it('returns null when T is missing or non-positive', () => {
      expect(service.resolveFluid({ fluid: 'air' })).toBeNull();
      expect(service.resolveFluid({ fluid: 'air', T_fluid_K: 0 })).toBeNull();
    });

    it('returns null for unknown fluid without composition', () => {
      expect(service.resolveFluid({ fluid: 'unobtainium', T_fluid_K: 300 })).toBeNull();
    });

    it('resolves liquid water via compoundId with liquid density and high Pr', () => {
      const fluid = service.resolveFluid({
        compoundId: 'water',
        phase: FluidPhase.Liquid,
        T_fluid_K: 298.15,
        P_Pa: STANDARD_CONDITIONS.PRESSURE_PA,
      });
      expect(fluid).not.toBeNull();
      expect(fluid!.rho_kg_m3).toBeGreaterThan(990);
      expect(fluid!.mu_Pa_s).toBeGreaterThan(5e-4);
      expect(fluid!.lambda).toBeGreaterThan(0.5);
      const Pr = (fluid!.mu_Pa_s * fluid!.Cp_J_kgK) / fluid!.lambda;
      expect(Pr).toBeGreaterThan(5);
    });

    it('resolves liquid water via fluid H2O alias', () => {
      const fluid = service.resolveFluid({
        fluid: 'H2O',
        phase: FluidPhase.Liquid,
        T_fluid_K: 298.15,
      });
      expect(fluid).not.toBeNull();
      expect(fluid!.rho_kg_m3).toBeGreaterThan(990);
    });

    it('rejects liquid gas_mix', () => {
      expect(
        service.resolveFluid({
          fluid: 'gas_mix',
          phase: FluidPhase.Liquid,
          T_fluid_K: 300,
          composition: { [Species.N2]: 1 },
        }),
      ).toBeNull();
    });
  });

  describe('scalar endpoints', () => {
    const pipe = {
      geometry: FlowGeometry.PIPE_CIRCULAR,
      dimensions: { a: 0.05 },
      fluid: 'air',
      T_fluid_K: 300,
      P_Pa: STANDARD_CONDITIONS.PRESSURE_PA,
    };

    it('reynolds returns Re and resolved fluid', () => {
      const res = service.reynolds({ ...pipe, w_m_s: 5 });
      expect(res.symbol).toBe('Re');
      expect(res.value).toBeGreaterThan(1000);
      expect(res.L_m).toBeCloseTo(0.1, 12); // a is radius → L = 2a
      expect(res.resolvedFluid?.rho_kg_m3).toBeGreaterThan(0);
    });

    it('prandtl returns air-like Pr near 0.7', () => {
      const res = service.prandtl({
        fluid: 'air',
        T_fluid_K: 300,
      });
      expect(res.symbol).toBe('Pr');
      expect(res.value).toBeGreaterThan(0.6);
      expect(res.value).toBeLessThan(0.9);
    });

    it('grashof and rayleigh are positive for heated pipe', () => {
      const gr = service.grashof({
        ...pipe,
        T_hot_K: 350,
        T_cold_K: 300,
      });
      const ra = service.rayleigh({
        ...pipe,
        T_hot_K: 350,
        T_cold_K: 300,
      });
      expect(gr.symbol).toBe('Gr');
      expect(ra.symbol).toBe('Ra');
      expect(gr.value).toBeGreaterThan(0);
      expect(ra.value).toBeGreaterThan(gr.value * 0.5);
    });
  });

  describe('nusselt / resolveDimensionlessProperties', () => {
    it('nusselt returns Re, Pr, Nu for forced convection in a pipe', () => {
      const res = service.nusselt({
        geometry: FlowGeometry.PIPE_CIRCULAR,
        dimensions: { a: 0.05 },
        fluid: 'air',
        T_fluid_K: 300,
        w_m_s: 8,
      });
      expect(res.Re).toBeGreaterThan(1000);
      expect(res.Pr).toBeGreaterThan(0.5);
      expect(res.Nu).toBeGreaterThan(0);
      expect(res.correlation).toBeTruthy();
    });

    it('nusselt returns finite Nu and h for liquid water in a pipe', () => {
      const res = service.nusselt({
        geometry: FlowGeometry.PIPE_CIRCULAR,
        dimensions: { a: 0.01 },
        compoundId: 'water',
        phase: FluidPhase.Liquid,
        T_fluid_K: 300,
        T_surface_K: 320,
        w_m_s: 0.5,
      });
      expect(res.Pr).toBeGreaterThan(5);
      expect(res.Re).toBeGreaterThan(0);
      expect(res.Nu).toBeGreaterThan(0);
      expect(Number.isFinite(res.Nu)).toBe(true);
      expect(res.h_W_m2K).toBeGreaterThan(0);
    });

    it('throws when fluid cannot be resolved', () => {
      expect(() =>
        service.nusselt({
          geometry: FlowGeometry.PIPE_CIRCULAR,
          dimensions: { a: 0.05 },
          fluid: 'unobtainium',
          T_fluid_K: 300,
          w_m_s: 1,
        }),
      ).toThrow(/Cannot resolve fluid properties/);
    });

    it('sets Gr/Ra when surface temperature is provided', () => {
      const resolved = service.resolveDimensionlessProperties({
        geometry: FlowGeometry.PIPE_CIRCULAR,
        dimensions: { a: 0.05 },
        fluid: 'air',
        T_fluid_K: 300,
        T_surface_K: 400,
        w_m_s: 0,
      });
      expect(resolved.Gr).toBeGreaterThan(0);
      expect(resolved.Ra).toBeCloseTo(resolved.Gr * resolved.Pr, 6);
      expect(resolved.Re).toBe(0);
    });
  });
});
