import { AerodynamicsService } from '../../../../src/modules/thermodynamics/services/aerodynamics.service';

describe('AerodynamicsService', () => {
  const service = new AerodynamicsService();

  describe('pressureDrop (Ergun)', () => {
    const base = {
      v_m_s: 1.0,
      D_p_m: 0.005,
      epsilon: 0.4,
      rho_kg_m3: 1.2,
      mu_Pa_s: 1.8e-5,
    };

    it('matches the Ergun viscous + inertial sum', () => {
      const e3 = Math.pow(base.epsilon, 3);
      const term1 =
        150 *
        Math.pow(1 - base.epsilon, 2) *
        base.mu_Pa_s *
        base.v_m_s /
        (e3 * base.D_p_m * base.D_p_m);
      const term2 =
        1.75 *
        (1 - base.epsilon) *
        base.rho_kg_m3 *
        base.v_m_s *
        base.v_m_s /
        (e3 * base.D_p_m);
      expect(service.pressureDrop(base)).toBeCloseTo(term1 + term2, 10);
    });

    it('increases with superficial velocity', () => {
      const slow = service.pressureDrop({ ...base, v_m_s: 0.5 });
      const fast = service.pressureDrop({ ...base, v_m_s: 2.0 });
      expect(fast).toBeGreaterThan(slow);
    });

    it('increases when bed voidage decreases', () => {
      const open = service.pressureDrop({ ...base, epsilon: 0.5 });
      const dense = service.pressureDrop({ ...base, epsilon: 0.3 });
      expect(dense).toBeGreaterThan(open);
    });

    it('increases for smaller particles', () => {
      const coarse = service.pressureDrop({ ...base, D_p_m: 0.01 });
      const fine = service.pressureDrop({ ...base, D_p_m: 0.002 });
      expect(fine).toBeGreaterThan(coarse);
    });
  });

  describe('superficialVelocity', () => {
    it('equals ṁ/(ρ·A)', () => {
      expect(service.superficialVelocity(0.12, 1.2, 0.05)).toBeCloseTo(0.12 / (1.2 * 0.05), 12);
    });

    it('scales inversely with density and area', () => {
      const a = service.superficialVelocity(1, 1, 1);
      const b = service.superficialVelocity(1, 2, 2);
      expect(b).toBeCloseTo(a / 4, 12);
    });
  });
});
