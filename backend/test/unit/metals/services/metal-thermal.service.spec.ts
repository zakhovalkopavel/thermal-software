import { NotFoundException } from '@nestjs/common';
import { MetalMaterial } from '../../../../src/modules/metals/enums/metal-material.enum';
import { MetalThermalService } from '../../../../src/modules/metals/services/metal-thermal.service';

describe('MetalThermalService', () => {
  let service: MetalThermalService;

  beforeEach(() => {
    service = new MetalThermalService();
  });

  describe('lambda', () => {
    it('AISI_304 at 800 K - returns the Kelvin-based quadratic fit', () => {
      const expected = 9.705 + 0.0176 * 800 - 1.6e-6 * 800 * 800; // ASM fit in Kelvin
      expect(service.lambda(MetalMaterial.AISI_304, 800)).toBeCloseTo(expected, 3);
    });

    it('AISI_304 at 300 K - returns the Kelvin-based quadratic fit', () => {
      const expected = 9.705 + 0.0176 * 300 - 1.6e-6 * 300 * 300; // ASM fit in Kelvin
      expect(service.lambda(MetalMaterial.AISI_304, 300)).toBeCloseTo(expected, 3);
    });

    it('MILD_STEEL at 573 K - returns the Celsius-based cubic fit', () => {
      const tCelsius = 573 - 273; // t = 300 °C
      const expected =
        6.56e-8 * Math.pow(tCelsius, 3)
        - 8.34e-5 * tCelsius * tCelsius
        - 8.06e-4 * tCelsius
        + 49.16;
      expect(service.lambda(MetalMaterial.MILD_STEEL, 573)).toBeCloseTo(expected, 3);
    });

    it('MILD_STEEL at 273 K - returns the zero-Celsius intercept', () => {
      const expected = 49.16; // t = 0 °C
      expect(service.lambda(MetalMaterial.MILD_STEEL, 273)).toBeCloseTo(expected, 3);
    });

    it('unknown material - throws NotFoundException', () => {
      expect(() => service.lambda('unknown-material' as MetalMaterial, 800)).toThrow(NotFoundException);
    });
  });

  describe('emissivity', () => {
    it('AISI_304 at 1000 K - returns the oxidized-surface linear fit', () => {
      const expected = 0.42 + 1e-5 * 30 * 1000;
      expect(service.emissivity(MetalMaterial.AISI_304, 1000)).toBeCloseTo(expected, 2);
    });

    it('AISI_304 below T_min - clamps to the minimum valid temperature', () => {
      const expected = 0.42 + 1e-5 * 30 * 600; // clamped to T_min = 600 K
      expect(service.emissivity(MetalMaterial.AISI_304, 500)).toBeCloseTo(expected, 2);
    });

    it('MILD_STEEL at 800 K - returns the oxidized-surface quadratic fit', () => {
      const expected = 0.173 + 1e-5 * 68.6 * 800 + 1e-8 * -25.6 * 800 * 800;
      expect(service.emissivity(MetalMaterial.MILD_STEEL, 800)).toBeCloseTo(expected, 3);
    });

    it('unknown material - throws NotFoundException', () => {
      expect(() => service.emissivity('unknown-material' as MetalMaterial, 800)).toThrow(NotFoundException);
    });
  });
});
