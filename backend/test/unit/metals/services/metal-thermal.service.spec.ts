import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MetalMaterial } from '../../../../src/modules/metals/enums/metal-material.enum';
import { MetalLambdaModel } from '../../../../src/modules/metals/enums/metal-lambda-model.enum';
import { MetalThermalService } from '../../../../src/modules/metals/services/metal-thermal.service';
import { MetalDataset } from '../../../../src/modules/metals/utils/metal-dataset';
import { Kct56Conductivity } from '../../../../src/modules/metals/utils/kct56-conductivity';
import { celsiusToKelvin, kelvinToCelsius } from '../../../../src/common/thermal/utils/temperature';

describe('MetalThermalService', () => {
  let service: MetalThermalService;

  beforeEach(() => {
    MetalDataset.resetCache();
    service = new MetalThermalService();
  });

  describe('lambda (poly overrides)', () => {
    it('AISI_304 at 800 K - returns the Kelvin-based quadratic fit', () => {
      const expected = 9.705 + 0.0176 * 800 - 1.6e-6 * 800 * 800;
      expect(service.lambda(MetalMaterial.AISI_304, 800)).toBeCloseTo(expected, 3);
    });

    it('AISI_304 at 300 K - returns the Kelvin-based quadratic fit', () => {
      const expected = 9.705 + 0.0176 * 300 - 1.6e-6 * 300 * 300;
      expect(service.lambda(MetalMaterial.AISI_304, 300)).toBeCloseTo(expected, 3);
    });

    it('MILD_STEEL at 573 K - returns the Celsius-based cubic fit', () => {
      const tCelsius = kelvinToCelsius(573);
      const expected =
        6.56e-8 * Math.pow(tCelsius, 3)
        - 8.34e-5 * tCelsius * tCelsius
        - 8.06e-4 * tCelsius
        + 49.16;
      expect(service.lambda(MetalMaterial.MILD_STEEL, 573)).toBeCloseTo(expected, 3);
    });

    it('MILD_STEEL at 0 °C - returns the zero-Celsius intercept', () => {
      expect(service.lambda(MetalMaterial.MILD_STEEL, celsiusToKelvin(0))).toBeCloseTo(49.16, 3);
    });

    it('unknown material - throws NotFoundException', () => {
      expect(() => service.lambda('unknown-material', 800)).toThrow(NotFoundException);
    });
  });

  describe('emissivity', () => {
    it('AISI_304 at 1000 K - returns the oxidized-surface linear fit', () => {
      const expected = 0.42 + 1e-5 * 30 * 1000;
      expect(service.emissivity(MetalMaterial.AISI_304, 1000)).toBeCloseTo(expected, 2);
    });

    it('AISI_304 below T_min - clamps to the minimum valid temperature', () => {
      const expected = 0.42 + 1e-5 * 30 * 600;
      expect(service.emissivity(MetalMaterial.AISI_304, 500)).toBeCloseTo(expected, 2);
    });

    it('MILD_STEEL at 800 K - returns the oxidized-surface quadratic fit', () => {
      const expected = 0.173 + 1e-5 * 68.6 * 800 + 1e-8 * -25.6 * 800 * 800;
      expect(service.emissivity(MetalMaterial.MILD_STEEL, 800)).toBeCloseTo(expected, 3);
    });

    it('dataset alloy without ε - throws NotFoundException', () => {
      expect(() => service.emissivity('uns-g10080', 800)).toThrow(NotFoundException);
    });
  });

  describe('listMaterials', () => {
    it('includes poly overrides and synthesized alloys', () => {
      const list = service.listMaterials();
      const ids = list.map(m => m.materialId);
      expect(ids).toEqual(expect.arrayContaining(Object.values(MetalMaterial)));
      expect(list.length).toBeGreaterThan(Object.values(MetalMaterial).length);
    });

    it('AISI_304 - emissivity range equals the data T_min_K / T_max_K', () => {
      const aisi = service.listMaterials().find(m => m.materialId === MetalMaterial.AISI_304);
      expect(aisi?.emissivityRange_K).toEqual({ min: 600, max: 1400 });
      expect(aisi?.name).toBe('AISI 304 stainless steel');
    });
  });

  describe('getThermalProperties', () => {
    it('poly mild steel returns λ and ε', () => {
      const result = service.getThermalProperties({ material: MetalMaterial.MILD_STEEL, T_K: 700 });
      expect(result.lambda_WmK).toBe(service.lambda(MetalMaterial.MILD_STEEL, 700));
      expect(result.emissivity).toBe(service.emissivity(MetalMaterial.MILD_STEEL, 700));
    });

    it('dataset carbon steel returns table λ at a knot temperature', () => {
      const T_K = celsiusToKelvin(100);
      const result = service.getThermalProperties({ material: 'sae-1008', T_K });
      expect(result.lambda_WmK).toBeGreaterThan(0);
      expect(result.emissivity).toBeUndefined();
    });

    it('dataset alloy outside table range - omits λ and notes the domain', () => {
      const result = service.getThermalProperties({ material: 'sae-1008', T_K: 50 });
      expect(result.lambda_WmK).toBeUndefined();
      expect(result.notes?.some((n) => /outside table domain/i.test(n))).toBe(true);
    });

    it('donor-filled alloy returns λ, Cp, α and resistivity when in domain', () => {
      const result = service.getThermalProperties({ material: '4340', T_K: 500 });
      expect(result.lambda_WmK).toBeGreaterThan(0);
      expect(result.specificHeat_JkgK).toBeGreaterThan(0);
      expect(result.thermalExpansion_1e6K).toBeGreaterThan(0);
      expect(result.electricalResistivity_OhmM).toBeGreaterThan(0);
      expect(result.emissivity).toBeUndefined();
      expect(result.donors).toBeDefined();
    });

    it('lambdaModel=kCT56 uses composition.C Chebyshev alternative', () => {
      const T_K = celsiusToKelvin(100);
      const result = service.getThermalProperties({
        material: 'sae-1025',
        T_K,
        lambdaModel: MetalLambdaModel.KCT56,
      });
      expect(result.lambdaModel).toBe(MetalLambdaModel.KCT56);
      expect(result.C_wtPct).toBe(0.25);
      expect(result.lambda_WmK).toBeCloseTo(
        Kct56Conductivity.evaluate(0.25, 100),
        6,
      );
      expect(result.notes?.[0]).toMatch(/kCT56|Chebyshev/i);
    });

    it('lambdaModel=kCT56 on poly grade - throws BadRequestException', () => {
      expect(() =>
        service.getThermalProperties({
          material: MetalMaterial.AISI_304,
          T_K: 800,
          lambdaModel: MetalLambdaModel.KCT56,
        }),
      ).toThrow(BadRequestException);
    });

    it('default lambdaModel remains table spline', () => {
      const T_K = celsiusToKelvin(100);
      const result = service.getThermalProperties({ material: 'sae-1008', T_K });
      expect(result.lambdaModel).toBe(MetalLambdaModel.TABLE);
      expect(result.C_wtPct).toBeUndefined();
    });
  });

  describe('lambdaKct56', () => {
    it('sae-1078 at 800 °C - near austenite band', () => {
      const { lambda, C_wtPct } = service.lambdaKct56(
        'sae-1078',
        celsiusToKelvin(800),
      );
      expect(C_wtPct).toBeCloseTo(0.785, 3);
      expect(lambda).toBeCloseTo(24.74, 1);
    });
  });
});
