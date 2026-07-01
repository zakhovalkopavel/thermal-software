import { NotFoundException } from '@nestjs/common';
import { RefractoryThermalMaterial } from '../../../../src/modules/refractory/enums/refractory-thermal-material.enum';
import { RefractoryThermalService } from '../../../../src/modules/refractory/services/refractory-thermal.service';

describe('RefractoryThermalService', () => {
  let service: RefractoryThermalService;

  beforeEach(() => {
    service = new RefractoryThermalService();
  });

  describe('lambda', () => {
    it('CHAMOTTE_SOLID at 1000 K - returns the tabulated linear fit', () => {
      const expected = 0.700 + 6.4e-4 * (1000 - 273); // t = 727 °C from Mikheev fit
      expect(service.lambda(RefractoryThermalMaterial.CHAMOTTE_SOLID, 1000)).toBeCloseTo(expected, 3);
    });

    it('CHAMOTTE_1300 at 1000 K - returns the tabulated linear fit', () => {
      const expected = 0.470 + 3.5e-4 * (1000 - 273); // t = 727 °C from Mikheev fit
      expect(service.lambda(RefractoryThermalMaterial.CHAMOTTE_1300, 1000)).toBeCloseTo(expected, 3);
    });

    it('SILICON_CARBIDE at 1273 K - returns the tabulated linear fit', () => {
      const expected = 13.73 - 4.555e-3 * (1273 - 273); // t = 1000 °C from Mikheev fit
      expect(service.lambda(RefractoryThermalMaterial.SILICON_CARBIDE, 1273)).toBeCloseTo(expected, 3);
    });

    it('BASALT_FIBER_MAT at 373 K - returns the cubic fit', () => {
      const tCelsius = 373 - 273; // t = 100 °C
      const expected =
        0.139
        - 7.97e-5 * tCelsius
        + 1.3e-7 * tCelsius * tCelsius
        + 2.73e-10 * tCelsius * tCelsius * tCelsius;
      expect(service.lambda(RefractoryThermalMaterial.BASALT_FIBER_MAT, 373)).toBeCloseTo(expected, 4);
    });

    it('ALUMINA_2500 at 1000 K - returns the tabulated linear fit', () => {
      const expected = 1.9 + 1.6e-3 * (1000 - 273); // t = 727 °C from Mikheev fit
      expect(service.lambda(RefractoryThermalMaterial.ALUMINA_2500, 1000)).toBeCloseTo(expected, 3);
    });

    it('unknown material - throws NotFoundException', () => {
      expect(() => service.lambda('unknown-material' as RefractoryThermalMaterial, 1000)).toThrow(NotFoundException);
    });
  });

  describe('emissivity', () => {
    it('CHAMOTTE_SOLID at 1273 K - returns the emissivity polynomial', () => {
      const expected = 0.84 + 1e-5 * -20 * 1273; // ε = a + 1e-5·b·T
      expect(service.emissivity(RefractoryThermalMaterial.CHAMOTTE_SOLID, 1273)).toBeCloseTo(expected, 3);
    });

    it('MULLITE_2300 at 1000 K - returns the exponential emissivity fit', () => {
      const expected = 26.186 * Math.pow(1000, -0.555); // ε = a · T^b
      expect(service.emissivity(RefractoryThermalMaterial.MULLITE_2300, 1000)).toBeCloseTo(expected, 3);
    });

    it('SILICON_CARBIDE at 1000 K - returns the emissivity polynomial', () => {
      const expected = 0.8 + 1e-5 * 15.4 * 1000 + 1e-8 * -9.01 * 1000 * 1000;
      expect(service.emissivity(RefractoryThermalMaterial.SILICON_CARBIDE, 1000)).toBeCloseTo(expected, 3);
    });

    it('CHAMOTTE_SOLID below T_min - clamps to the minimum valid temperature', () => {
      const expected = 0.84 + 1e-5 * -20 * 673; // clamped to T_min = 673 K
      expect(service.emissivity(RefractoryThermalMaterial.CHAMOTTE_SOLID, 300)).toBeCloseTo(expected, 4);
    });

    it('CHAMOTTE_SOLID above T_max - clamps to the maximum valid temperature', () => {
      const expected = 0.84 + 1e-5 * -20 * 1673; // clamped to T_max = 1673 K
      expect(service.emissivity(RefractoryThermalMaterial.CHAMOTTE_SOLID, 2000)).toBeCloseTo(expected, 4);
    });

    it('unknown material - throws NotFoundException', () => {
      expect(() => service.emissivity('unknown-material' as RefractoryThermalMaterial, 1000)).toThrow(NotFoundException);
    });
  });
});
