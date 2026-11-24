import { DimensionlessNumbersService } from '../../../../src/modules/thermodynamics/services/dimensionless-numbers.service';
import { FlowGeometry } from '../../../../src/modules/thermodynamics/enums/flow-geometry.enum';
import { BodyGeometry } from '../../../../src/modules/thermodynamics/enums/body-geometry.enum';
import { PHYSICAL_CONSTANTS } from '../../../../src/common/thermal/constants/physical.constants';
import { FlowRegime } from '../../../../src/modules/thermodynamics/types/flow-regime.type';

describe('DimensionlessNumbersService', () => {
  const service = new DimensionlessNumbersService();

  describe('scalar numbers', () => {
    it('reynolds matches ρ·w·L/μ', () => {
      expect(service.reynolds(1.2, 2, 0.05, 1.8e-5)).toBeCloseTo((1.2 * 2 * 0.05) / 1.8e-5, 10);
    });

    it('reynoldsKinematic matches w·L/ν', () => {
      expect(service.reynoldsKinematic(3, 0.1, 1.5e-5)).toBeCloseTo(3 * 0.1 / 1.5e-5, 10);
    });

    it('prandtl matches μ·Cp/λ', () => {
      expect(service.prandtl(1.8e-5, 1005, 0.026)).toBeCloseTo((1.8e-5 * 1005) / 0.026, 10);
    });

    it('grashof uses ideal-gas β = 2/(T_hot+T_cold)', () => {
      const T_h = 400;
      const T_c = 300;
      const L = 0.1;
      const nu = 2e-5;
      const beta = 2 / (T_h + T_c);
      const expected =
        PHYSICAL_CONSTANTS.STANDARD_GRAVITY_M_S2 *
        beta *
        Math.abs(T_h - T_c) *
        Math.pow(L, 3) /
        (nu * nu);
      expect(service.grashof(T_h, T_c, L, nu)).toBeCloseTo(expected, 8);
    });

    it('rayleigh equals Gr·Pr', () => {
      const Gr = service.grashof(350, 300, 0.05, 1.5e-5);
      const Pr = 0.7;
      expect(service.rayleigh(350, 300, 0.05, 1.5e-5, Pr)).toBeCloseTo(Gr * Pr, 8);
    });

    it('htc matches Nu·λ/L', () => {
      expect(service.htc(100, 0.03, 0.05)).toBeCloseTo((100 * 0.03) / 0.05, 10);
    });

    it('accepts custom gravity for grashof', () => {
      const earth = service.grashof(400, 300, 0.1, 2e-5);
      const moon = service.grashof(400, 300, 0.1, 2e-5, 1.62);
      expect(moon / earth).toBeCloseTo(1.62 / PHYSICAL_CONSTANTS.STANDARD_GRAVITY_M_S2, 8);
    });
  });

  describe('channel geometry', () => {
    it('characteristicLength / hydraulicDiameter for a circular pipe equal D=2a (a=radius)', () => {
      const dims = { a: 0.05 };
      expect(service.characteristicLength(FlowGeometry.PIPE_CIRCULAR, dims)).toBeCloseTo(0.1, 12);
      expect(service.hydraulicDiameter(FlowGeometry.PIPE_CIRCULAR, dims)).toBeCloseTo(0.1, 12);
      expect(service.channelArea(FlowGeometry.PIPE_CIRCULAR, dims)).toBeCloseTo(Math.PI * 0.05 ** 2, 10);
      expect(service.channelPerimeter(FlowGeometry.PIPE_CIRCULAR, dims)).toBeCloseTo(2 * Math.PI * 0.05, 10);
    });
  });

  describe('body geometry', () => {
    it('returns positive area, volume, and mean beam length for a cube', () => {
      const dims = { a: 1 };
      expect(service.bodyArea(BodyGeometry.CUBE, dims)).toBeGreaterThan(0);
      expect(service.bodyVolume(BodyGeometry.CUBE, dims)).toBeCloseTo(1, 10);
      expect(service.meanBeamLength(BodyGeometry.CUBE, dims)).toBeGreaterThan(0);
    });
  });

  describe('nusselt', () => {
    it('returns Nu and h for forced pipe flow with air-like props', () => {
      const resolved = {
        Re: 20000,
        Pr: 0.7,
        Gr: 0,
        Ra: 0,
        lambda: 0.026,
        mu_f: 1.8e-5,
        nu_f: 1.5e-5,
      };
      const result = service.nusselt(
        {
          geometry: FlowGeometry.PIPE_CIRCULAR,
          dimensions: { a: 0.05 },
          fluid: 'air',
          T_fluid_K: 300,
          w_m_s: 10,
        },
        resolved,
      );
      expect(result.Nu).toBeGreaterThan(0);
      expect(result.h_W_m2K).toBeGreaterThan(0);
      expect(result.correlation).toBeTruthy();
      expect(result.isNatural).toBe(false);
      expect([FlowRegime.TURBULENT, FlowRegime.TRANSITIONAL, FlowRegime.LAMINAR]).toContain(
        result.regime,
      );
    });

    it('fills allCorrelations when compareAll is true', () => {
      const resolved = {
        Re: 5000,
        Pr: 0.7,
        Gr: 0,
        Ra: 0,
        lambda: 0.026,
        mu_f: 1.8e-5,
        nu_f: 1.5e-5,
      };
      const result = service.nusselt(
        {
          geometry: FlowGeometry.PIPE_CIRCULAR,
          dimensions: { a: 0.05 },
          fluid: 'air',
          T_fluid_K: 300,
          w_m_s: 2,
          compareAll: true,
        },
        resolved,
      );
      expect(result.allCorrelations).toBeDefined();
      expect(Object.keys(result.allCorrelations!).length).toBeGreaterThan(0);
    });
  });
});
