import { ThermalPerformanceService } from '../../../../../src/modules/refractory/services/thermal/thermal-performance.service';
import { CALCULATION_CONSTANTS } from '../../../../../src/modules/refractory/constants/calculation.constants';

describe('ThermalPerformanceService', () => {
  let service: ThermalPerformanceService;

  /** Keys match COMPONENT_PROPERTIES chemical formulas. */
  const silicaAlumina = { SiO2: 40, Al2O3: 30, CaO: 10 };

  beforeEach(() => {
    service = new ThermalPerformanceService();
  });

  describe('calculateThermalConductivity — happy path', () => {
    it('returns conductivity, specific heat, density, diffusivity, and components', () => {
      const res = service.calculateThermalConductivity(silicaAlumina, 200, 0.2);
      expect(res.thermalConductivity_WmK).toBeGreaterThan(0);
      expect(res.specificHeat_JkgK).toBeGreaterThan(0);
      expect(res.density_kgm3).toBeGreaterThan(0);
      expect(res.thermalDiffusivity_m2s).toBeGreaterThan(0);
      expect(res.temperature_C).toBe(200);
      expect(res.porosity).toBe(0.2);
      expect(res.components).toEqual(
        expect.objectContaining({
          oxideFormers: expect.any(Object),
          oxideModifiers: expect.any(Object),
          fluorides: expect.any(Object),
          chlorides: expect.any(Object),
        }),
      );
    });

    it('uses DEFAULT_POROSITY when porosity is omitted', () => {
      const res = service.calculateThermalConductivity(silicaAlumina, 300);
      expect(res.porosity).toBe(CALCULATION_CONSTANTS.DEFAULT_POROSITY);
    });
  });

  describe('porosity effect', () => {
    it('gives higher conductivity at porosity 0 than at porosity 0.4', () => {
      const dense = service.calculateThermalConductivity(silicaAlumina, 300, 0);
      const porous = service.calculateThermalConductivity(silicaAlumina, 300, 0.4);
      expect(dense.porosity).toBe(0);
      expect(dense.thermalConductivity_WmK).toBeGreaterThan(porous.thermalConductivity_WmK);
      expect(dense.density_kgm3).toBe(CALCULATION_CONSTANTS.BASE_DENSITY_KGM3);
      expect(porous.density_kgm3).toBeCloseTo(
        CALCULATION_CONSTANTS.BASE_DENSITY_KGM3 * 0.6,
        0,
      );
    });

    it('scales density linearly with (1 − porosity)', () => {
      const p = 0.25;
      const res = service.calculateThermalConductivity(silicaAlumina, 100, p);
      expect(res.density_kgm3).toBeCloseTo(
        CALCULATION_CONSTANTS.BASE_DENSITY_KGM3 * (1 - p),
        0,
      );
    });
  });

  describe('temperature dependence', () => {
    it('changes conductivity with temperature via the Kingery coefficient', () => {
      const cold = service.calculateThermalConductivity(silicaAlumina, 20, 0);
      const hot = service.calculateThermalConductivity(silicaAlumina, 1000, 0);
      // THERMAL_CONDUCTIVITY_TEMP_COEFF is negative → higher T lowers k
      expect(hot.thermalConductivity_WmK).toBeLessThan(cold.thermalConductivity_WmK);
    });

    it('increases specific heat with temperature', () => {
      const cold = service.calculateThermalConductivity(silicaAlumina, 20, 0.1);
      const hot = service.calculateThermalConductivity(silicaAlumina, 800, 0.1);
      expect(hot.specificHeat_JkgK).toBeGreaterThan(cold.specificHeat_JkgK);
    });
  });

  describe('composition effects', () => {
    it('returns different conductivity for different oxide mixes', () => {
      const a = service.calculateThermalConductivity(
        { SiO2: 90, Al2O3: 10 },
        200,
        0.1,
      );
      const b = service.calculateThermalConductivity(
        { MgO: 90, Al2O3: 10 },
        200,
        0.1,
      );
      expect(a.thermalConductivity_WmK).not.toBe(b.thermalConductivity_WmK);
    });

    it('includes fluorides/chlorides in component breakdown when present', () => {
      const res = service.calculateThermalConductivity(
        { SiO2: 40, Al2O3: 40, CaF2: 10, NaCl: 10 },
        200,
        0.1,
      );
      expect(Object.keys(res.components.fluorides).length).toBeGreaterThan(0);
      expect(Object.keys(res.components.chlorides).length).toBeGreaterThan(0);
    });
  });
});

