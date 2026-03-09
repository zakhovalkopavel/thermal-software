/**
 * Integration tests for GlassViscosityService.calculateViscosity
 *
 * Covers: Lakatos path, Fluegel path, general edge cases, component breakdown.
 * Unit tests for utilities (composition conversion, isokom models, VTF math,
 * model selection) live in their own spec files under test/unit/refractory/utils/.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GlassViscosityService } from '../../../../src/modules/refractory/services/glass-viscosity.service';
import {
  ViscosityModel,
  ViscosityModelType,
  ConfidenceLevel,
} from '../../../../src/modules/refractory/enums/viscosity-model.enum';
import {
  LAKATOS_VALIDATION_GLASSES,
  FLUEGEL_VALIDATION_GLASSES,
  HETHERINGTON_VALIDATION_GLASSES,
} from '../../../../src/modules/refractory/data/glass-viscosity-validation.data';
import { VtfParameters } from '../../../../src/modules/refractory/interfaces/viscosity-parameters.interface';
import { temperatureAtLogViscosity } from '../../../../src/modules/refractory/utils/glass-viscosity-vtf.util';

// ─────────────────────────────────────────────────────────────────────────────

describe('GlassViscosityService — calculateViscosity', () => {
  let service: GlassViscosityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlassViscosityService],
    }).compile();
    service = module.get<GlassViscosityService>(GlassViscosityService);
  });

  // ─── Lakatos path (reserve model — must be requested explicitly) ─────────

  describe('Lakatos path', () => {
    const windowGlass = { SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4 };

    it('default routes to FLUEGEL_2007 (not Lakatos) for a standard SLS glass', () => {
      expect(service.calculateViscosity(windowGlass, 1100).model.systemType)
        .toBe(ViscosityModel.FLUEGEL_2007);
    });

    it('routes to LAKATOS_1976 when explicitly preferred', () => {
      expect(service.calculateViscosity(windowGlass, 1100, ViscosityModel.LAKATOS_1976).model.systemType)
        .toBe(ViscosityModel.LAKATOS_1976);
    });

    it('uses VFT model type when Lakatos preferred', () => {
      expect(service.calculateViscosity(windowGlass, 1100, ViscosityModel.LAKATOS_1976).model.type)
        .toBe(ViscosityModelType.VFT);
    });

    it('VTF predicts measured isokom T within 15°C for all Lakatos validation glasses (Lakatos preferred)', () => {
      for (const glass of LAKATOS_VALIDATION_GLASSES) {
        const r = service.calculateViscosity(glass.composition_wt_pct, glass.isokoms[0].T_model_C, ViscosityModel.LAKATOS_1976);
        const vtf: VtfParameters = { A: r.model.parameters.A, B: r.model.parameters.B!, T0: r.model.parameters.T0! };
        for (const pt of glass.isokoms) {
          if (pt.T_measured_C !== undefined) {
            const T_pred = temperatureAtLogViscosity(vtf, pt.logEta);
            expect(Math.abs(T_pred - pt.T_measured_C)).toBeLessThan(15);
          }
        }
      }
    });

    it('all ASTM fixed points are defined, finite and in correct order (Lakatos preferred)', () => {
      const fp = service.calculateViscosity(windowGlass, 1100, ViscosityModel.LAKATOS_1976).fixedPoints;
      expect(fp.meltingPoint_C).toBeGreaterThan(fp.workingPoint_C);
      expect(fp.workingPoint_C).toBeGreaterThan(fp.softeningPoint_C);
      expect(fp.softeningPoint_C).toBeGreaterThan(fp.annealingPoint_C);
      expect(fp.annealingPoint_C).toBeGreaterThan(fp.strainPoint_C);
      for (const key of ['meltingPoint_C','workingPoint_C','softeningPoint_C','annealingPoint_C','strainPoint_C'] as const) {
        expect(isFinite(fp[key])).toBe(true);
      }
    });

    it('all spans are positive (Lakatos preferred)', () => {
      const spans = service.calculateViscosity(windowGlass, 1100, ViscosityModel.LAKATOS_1976).fixedPoints.spans!;
      expect(spans.meltingToStrain_C).toBeGreaterThan(0);
      expect(spans.workingToSoftening_C).toBeGreaterThan(0);
      expect(spans.softeningToAnnealing_C).toBeGreaterThan(0);
      expect(spans.annealingToStrain_C).toBeGreaterThan(0);
    });

    it('confidence is HIGH for in-range SLS composition (Lakatos preferred)', () => {
      expect(service.calculateViscosity(windowGlass, 1100, ViscosityModel.LAKATOS_1976).validation.confidenceLevel)
        .toBe(ConfidenceLevel.HIGH);
    });

    it('metadata reference mentions Lakatos when Lakatos preferred', () => {
      expect(service.calculateViscosity(windowGlass, 1100, ViscosityModel.LAKATOS_1976).metadata.reference.toLowerCase())
        .toContain('lakatos');
    });

    it('falls back to FLUEGEL_2007 when Lakatos preferred but out of range (borosilicate)', () => {
      const pyrex = { SiO2: 80.6, B2O3: 12.9, Al2O3: 2.3, Na2O: 3.9, K2O: 0.3 };
      const r = service.calculateViscosity(pyrex, 1200, ViscosityModel.LAKATOS_1976);
      expect(r.model.systemType).toBe(ViscosityModel.FLUEGEL_2007);
    });
  });

  // ─── Fluegel path ──────────────────────────────────────────────────────────

  describe('Fluegel path', () => {

    it('routes NIST SRM 717A (borosilicate) to FLUEGEL_2007', () => {
      const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'NIST SRM 717A')!;
      expect(service.calculateViscosity(glass.composition_wt_pct, 1200).model.systemType)
        .toBe(ViscosityModel.FLUEGEL_2007);
    });

    it('routes NIST SRM 711 (lead glass) to FLUEGEL_2007', () => {
      const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'NIST SRM 711')!;
      expect(service.calculateViscosity(glass.composition_wt_pct, 900).model.systemType)
        .toBe(ViscosityModel.FLUEGEL_2007);
    });

    it('metadata reference mentions Fluegel', () => {
      const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'NIST SRM 717A')!;
      expect(service.calculateViscosity(glass.composition_wt_pct, 1200).metadata.reference.toLowerCase())
        .toContain('fluegel');
    });
  });

  // ─── Hetherington path ─────────────────────────────────────────────────────

  describe('Hetherington path', () => {
    const glass = HETHERINGTON_VALIDATION_GLASSES[0];
    const A = -3.905, B = 31400;

    for (const pt of glass.isokoms) {
      it(`returns correct log η at ${pt.T_model_C}°C (±0.05)`, () => {
        const r = service.calculateViscosity(glass.composition_wt_pct, pt.T_model_C);
        expect(r.logViscosity).toBeCloseTo(pt.logEta, 1);
        // Verify the formula: T_K = B / (logEta - A)
        const T_K = B / (pt.logEta - A);
        expect(T_K - 273.15).toBeCloseTo(pt.T_model_C, 0);
      });
    }

    it('uses ARRHENIUS model type', () => {
      expect(service.calculateViscosity({ SiO2: 100 }, 1800).model.type)
        .toBe(ViscosityModelType.ARRHENIUS);
    });
  });

  // ─── General edge cases ────────────────────────────────────────────────────

  describe('general', () => {
    it('viscosity_Pas is always positive and finite', () => {
      for (const glass of [...LAKATOS_VALIDATION_GLASSES, ...FLUEGEL_VALIDATION_GLASSES]) {
        const r = service.calculateViscosity(glass.composition_wt_pct, glass.isokoms[1].T_model_C);
        expect(r.viscosity_Pas).toBeGreaterThan(0);
        expect(isFinite(r.viscosity_Pas)).toBe(true);
      }
    });

    it('normalises composition that does not sum to 100', () => {
      const r = service.calculateViscosity({ SiO2: 36.1, Na2O: 6.7, CaO: 5.6, MgO: 0.75, Al2O3: 0.65, K2O: 0.2 }, 1100);
      expect(Object.values(r.composition).reduce((s, v) => s + v, 0)).toBeCloseTo(100, 1);
    });

    it('throws for empty composition', () => {
      expect(() => service.calculateViscosity({}, 1100)).toThrow();
    });

    it('throws for all-zero composition', () => {
      expect(() => service.calculateViscosity({ SiO2: 0 }, 1100)).toThrow();
    });

    it('does NOT throw for slag — routes to IIDA model', () => {
      expect(() => service.calculateViscosity({ CaO: 45, Al2O3: 35, SiO2: 18, MgO: 2 }, 1450)).not.toThrow();
    });

    it('throws BadRequestException for pure fluoride glass (NOT_SUPPORTED)', () => {
      expect(() => service.calculateViscosity({ CaF2: 60, AlF3: 25, NaF: 15 }, 500)).toThrow();
    });
  });

  // ─── Component breakdown ───────────────────────────────────────────────────

  describe('component breakdown', () => {
    const comp = { SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4 };

    it('classifies SiO₂ as a network former', () => {
      expect(service.calculateViscosity(comp, 1100).components.networkFormers.some(c => c.component === 'SiO2'))
        .toBe(true);
    });

    it('classifies Na₂O as a network modifier', () => {
      expect(service.calculateViscosity(comp, 1100).components.networkModifiers.some(c => c.component === 'Na2O'))
        .toBe(true);
    });

    it('classifies CaF₂ as a fluoride', () => {
      const r = service.calculateViscosity(
        { SiO2: 65, Na2O: 11, CaO: 10, MgO: 5, Al2O3: 2, K2O: 2, CaF2: 5 }, 1100,
      );
      expect(r.components.fluorides.some(c => c.component === 'CaF2')).toBe(true);
    });
  });
});

