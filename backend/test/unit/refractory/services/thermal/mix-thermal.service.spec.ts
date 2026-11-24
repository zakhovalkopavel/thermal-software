import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MaterialCatalogService } from '../../../../../src/modules/refractory/services/catalog/material-catalog.service';
import { MixComponentCatalogService } from '../../../../../src/modules/refractory/services/catalog/mix-component-catalog.service';
import { MixThermalService } from '../../../../../src/modules/refractory/services/thermal/mix-thermal.service';
import { ConductionLaw } from '../../../../../src/modules/refractory/enums/conduction-law.enum';
import { ThermalReferenceSource } from '../../../../../src/modules/refractory/enums/thermal-reference-source.enum';
import { MIX_THERMAL_CONSTANTS } from '../../../../../src/modules/refractory/constants/mix-thermal.constants';
import { kelvinToCelsius } from '../../../../../src/common/thermal/utils/temperature';

const single = (materialId: string, temperatures_C: number[], porosity = 0) => ({
  fractions: [{ materialId, massFraction: 1 }],
  temperatures_C,
  porosity,
});

describe('MixThermalService', () => {
  let service: MixThermalService;

  beforeEach(() => {
    service = new MixThermalService(new MixComponentCatalogService(new MaterialCatalogService()));
  });

  describe('fired phases', () => {
    it('silicon_carbide stays SiC after firing (not converted to its oxide impurities)', () => {
      const r = service.calculate(single('silicon_carbide', [20]));
      expect(r.firedPhases_wt['SiC']).toBeGreaterThan(98);
      expect(r.heatCapacityCoverage_wt).toBeCloseTo(100, 6);
    });

    it('titanium_nitride keeps TiN; the 0.3 % Ti impurity is dropped', () => {
      const r = service.calculate(single('titanium_nitride', [20]));
      expect(r.firedPhases_wt['TiN']).toBeGreaterThan(98);
      expect(r.firedPhases_wt).not.toHaveProperty('Ti');
      expect(r.materials[0].conductionLaw).toBe(ConductionLaw.ELECTRONIC);
    });

    it('kaolinite loses its water: fired phases sum to 100 and LOI = 14 %', () => {
      const r = service.calculate(single('kaolinite', [20]));
      expect(r.lossOnIgnition_wt).toBeCloseTo(14, 6);
      expect(Object.values(r.firedPhases_wt).reduce((s, v) => s + v, 0)).toBeCloseTo(100, 6);
      expect(r.firedPhases_wt).not.toHaveProperty('H2O');
    });
  });

  describe('specific heat', () => {
    it('different materials give different Cp (no constant fallback)', () => {
      const cp = (id: string) => service.calculate(single(id, [20])).points[0].specificHeat_JkgK;
      expect(new Set(['alumina_tabular', 'silica_quartz', 'magnesia_fused', 'silicon_carbide', 'zircon'].map(cp)).size).toBe(5);
    });

    it('SiC Cp ≈ 670 J/(kg·K) at room temperature and ≈ 1250 at 1200 °C (NASA-9)', () => {
      const [cold, hot] = service.calculate(single('silicon_carbide', [25, 1200])).points;
      expect(cold.specificHeat_JkgK).toBeGreaterThan(640);
      expect(cold.specificHeat_JkgK).toBeLessThan(700);
      expect(hot.specificHeat_JkgK).toBeGreaterThan(1200);
      expect(hot.specificHeat_JkgK).toBeLessThan(1300);
    });

    it('alumina Cp ≈ 775 J/(kg·K) at 25 °C and increases with temperature', () => {
      const points = service.calculate(single('alumina_tabular', [25, 400, 800, 1200])).points;
      expect(points[0].specificHeat_JkgK).toBeGreaterThan(750);
      expect(points[0].specificHeat_JkgK).toBeLessThan(800);
      for (let i = 1; i < points.length; i++) {
        expect(points[i].specificHeat_JkgK).toBeGreaterThan(points[i - 1].specificHeat_JkgK);
      }
    });

    it('chromium_carbide (no NASA-9 Cr3C2) uses its library Cp and warns', () => {
      const r = service.calculate(single('chromium_carbide', [20, 1000]));
      expect(r.heatCapacityCoverage_wt).toBeLessThan(5);
      expect(r.warnings.some(w => w.includes('Cr3C2'))).toBe(true);
      expect(r.points[0].specificHeat_JkgK).toBeGreaterThan(450);
      expect(r.points[0].specificHeat_JkgK).toBeLessThan(550);
    });
  });

  describe('conductivity', () => {
    it('dense λ at the reference temperature equals the library λ', () => {
      const T_C = kelvinToCelsius(MIX_THERMAL_CONSTANTS.referenceTemperature_K);
      const r = service.calculate(single('silicon_carbide', [T_C]));
      expect(r.points[0].lambdaSolid_WmK).toBeCloseTo(120, 2);
      expect(r.points[0].lambdaEffective_WmK).toBeCloseTo(120, 2);
    });

    it('phonon conductors lose conductivity with temperature, electronic ones keep it', () => {
      const sic = service.calculate(single('silicon_carbide', [25, 1200])).points;
      expect(sic[1].lambdaSolid_WmK).toBeLessThan(sic[0].lambdaSolid_WmK / 3);
      const tin = service.calculate(single('titanium_nitride', [25, 1200])).points;
      expect(tin[1].lambdaSolid_WmK).toBeCloseTo(tin[0].lambdaSolid_WmK, 6);
    });

    it('porosity 0.2 keeps λ_eff of a good conductor near 2(1−P)/(2+P) · λ_s (not ~0.2 W/(m·K))', () => {
      const r = service.calculate(single('alumina_tabular', [25], 0.2));
      const { lambdaSolid_WmK, lambdaEffective_WmK } = r.points[0];
      expect(lambdaEffective_WmK / lambdaSolid_WmK).toBeCloseTo((2 * 0.8) / 2.2, 2);
    });

    it('clay without library λ uses the group median and says so', () => {
      const r = service.calculate(single('kaolinite', [20]));
      expect(r.materials[0].lambdaReferenceSource).toBe(ThermalReferenceSource.GROUP_MEDIAN);
      expect(r.warnings.some(w => w.includes('kaolinite'))).toBe(true);
    });
  });

  describe('density and diffusivity', () => {
    it('bulk density uses the library true density', () => {
      const r = service.calculate(single('silicon_carbide', [20], 0.25));
      expect(r.trueDensity_kgm3).toBeCloseTo(3210, 6);
      expect(r.bulkDensity_kgm3).toBeCloseTo(3210 * 0.75, 6);
    });

    it('diffusivity = λ_eff / (ρ_bulk · Cp)', () => {
      const r = service.calculate(single('magnesia_fused', [500], 0.1));
      const p = r.points[0];
      expect(p.thermalDiffusivity_m2s).toBeCloseTo(p.lambdaEffective_WmK / (r.bulkDensity_kgm3 * p.specificHeat_JkgK), 9);
    });
  });

  describe('mix', () => {
    it('50/50 SiC + alumina lies between the two materials', () => {
      const T = [25, 1000];
      const mix = service.calculate({
        fractions: [{ materialId: 'silicon_carbide', massFraction: 0.5 }, { materialId: 'alumina_tabular', massFraction: 0.5 }],
        temperatures_C: T,
        porosity: 0,
      });
      const sic = service.calculate(single('silicon_carbide', T));
      const alumina = service.calculate(single('alumina_tabular', T));
      for (let i = 0; i < T.length; i++) {
        const lo = Math.min(sic.points[i].lambdaSolid_WmK, alumina.points[i].lambdaSolid_WmK);
        const hi = Math.max(sic.points[i].lambdaSolid_WmK, alumina.points[i].lambdaSolid_WmK);
        expect(mix.points[i].lambdaSolid_WmK).toBeGreaterThan(lo);
        expect(mix.points[i].lambdaSolid_WmK).toBeLessThan(hi);
      }
      expect(mix.materials.reduce((s, m) => s + m.volumeFraction, 0)).toBeCloseTo(1, 9);
    });
  });

  describe('errors', () => {
    it('Σ massFraction = 0 → 400', () => {
      expect(() =>
        service.calculate({ fractions: [{ materialId: 'alumina_tabular', massFraction: 0 }], temperatures_C: [20], porosity: 0 }),
      ).toThrow(BadRequestException);
    });

    it('material outside the mix components → 400', () => {
      expect(() => service.calculate(single('soda_lime_glass', [20]))).toThrow(BadRequestException);
    });

    it('unknown material → 404', () => {
      expect(() => service.calculate(single('unobtainium', [20]))).toThrow(NotFoundException);
    });
  });
});
