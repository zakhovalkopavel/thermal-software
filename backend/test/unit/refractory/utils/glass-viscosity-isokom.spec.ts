/**
 * Unit tests for isokom regression models
 *
 * Covers:
 *   predictIsokomsLakatos — Lakatos 1976 regression vs paper Table 1A/1B
 *   predictIsokomsFluegel — Fluegel 2007 regression vs paper Table 12
 *   Hetherington 1964     — Arrhenius formula self-check via service
 */

import { Test, TestingModule } from '@nestjs/testing';
import { GlassViscosityService } from '../../../../src/modules/refractory/services/glass-viscosity.service';
import { ViscosityModelType } from '../../../../src/modules/refractory/enums/viscosity-model.enum';
import {
  predictIsokomsLakatos,
  predictIsokomsFluegel,
} from '../../../../src/modules/refractory/utils/glass-viscosity-vtf.util';
import { wtPctToMolPct } from '../../../../src/modules/refractory/utils/glass-composition.util';
import {
  LAKATOS_VALIDATION_GLASSES,
  FLUEGEL_VALIDATION_GLASSES,
  HETHERINGTON_VALIDATION_GLASSES,
} from '../../../../src/modules/refractory/data/glass-viscosity-validation.data';

// ─────────────────────────────────────────────────────────────────────────────

describe('predictIsokomsLakatos — regression vs paper Table 1A/1B', () => {
  for (const glass of LAKATOS_VALIDATION_GLASSES) {
    it(`${glass.id} (${glass.description}): isokom T matches paper to <${glass.tolerance_model_C}°C`, () => {
      const iso = predictIsokomsLakatos(glass.composition_wt_pct);
      const [p1, p2, p3] = glass.isokoms;
      if (
        Math.abs(iso.T_logEta1 - p1.T_model_C) >= glass.tolerance_model_C ||
        Math.abs(iso.T_logEta3 - p2.T_model_C) >= glass.tolerance_model_C ||
        Math.abs(iso.T_logEta5 - p3.T_model_C) >= glass.tolerance_model_C
      ) {
        console.log({
          id: glass.id,
          composition: glass.composition_wt_pct,
          got:  { T1: +iso.T_logEta1.toFixed(1), T3: +iso.T_logEta3.toFixed(1), T5: +iso.T_logEta5.toFixed(1) },
          want: { T1: p1.T_model_C,              T3: p2.T_model_C,              T5: p3.T_model_C },
        });
      }
      expect(Math.abs(iso.T_logEta1 - p1.T_model_C)).toBeLessThan(glass.tolerance_model_C);
      expect(Math.abs(iso.T_logEta3 - p2.T_model_C)).toBeLessThan(glass.tolerance_model_C);
      expect(Math.abs(iso.T_logEta5 - p3.T_model_C)).toBeLessThan(glass.tolerance_model_C);
    });
  }

  it('produces strictly decreasing T with increasing viscosity for all validation glasses', () => {
    for (const glass of LAKATOS_VALIDATION_GLASSES) {
      const iso = predictIsokomsLakatos(glass.composition_wt_pct);
      expect(iso.T_logEta1).toBeGreaterThan(iso.T_logEta3);
      expect(iso.T_logEta3).toBeGreaterThan(iso.T_logEta5);
    }
  });

  it('warns when Na₂O exceeds Lakatos upper bound', () => {
    const iso = predictIsokomsLakatos({ SiO2: 65, Na2O: 19, CaO: 10, MgO: 3, Al2O3: 1 });
    expect(iso.warnings.some(w => w.includes('Na'))).toBe(true);
  });

  it('warns about non-Lakatos components > 2 wt%', () => {
    const iso = predictIsokomsLakatos({ SiO2: 70, Na2O: 13, CaO: 10, Fe2O3: 5, MgO: 2 });
    expect(iso.warnings.some(w => /Fe2O3|not modelled/i.test(w))).toBe(true);
  });

  it('throws for zero SiO₂', () => {
    expect(() => predictIsokomsLakatos({ Na2O: 25, CaO: 75 })).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('predictIsokomsFluegel — regression vs Fluegel 2007 Table 12', () => {
  for (const glass of FLUEGEL_VALIDATION_GLASSES) {
    it(`${glass.id} (${glass.description}): isokom T matches Table 12 model to <${glass.tolerance_model_C}°C`, () => {
      const iso = predictIsokomsFluegel(glass.composition_wt_pct);
      const [p1, p2, p3] = glass.isokoms;
      if (
        Math.abs(iso.T_logEta1_5 - p1.T_model_C) >= glass.tolerance_model_C ||
        Math.abs(iso.T_logEta6_6 - p2.T_model_C) >= glass.tolerance_model_C ||
        Math.abs(iso.T_logEta12  - p3.T_model_C) >= glass.tolerance_model_C
      ) {
        const molPct = wtPctToMolPct(glass.composition_wt_pct);
        console.log({
          id: glass.id,
          composition_wt_pct: glass.composition_wt_pct,
          molPct: Object.fromEntries(Object.entries(molPct).map(([k, v]) => [k, +v.toFixed(3)])),
          got:  { T1_5: +iso.T_logEta1_5.toFixed(1), T6_6: +iso.T_logEta6_6.toFixed(1), T12: +iso.T_logEta12.toFixed(1) },
          want: { T1_5: p1.T_model_C,                T6_6: p2.T_model_C,                T12: p3.T_model_C },
          errors: {
            err1_5: +(iso.T_logEta1_5 - p1.T_model_C).toFixed(1),
            err6_6: +(iso.T_logEta6_6 - p2.T_model_C).toFixed(1),
            err12:  +(iso.T_logEta12  - p3.T_model_C).toFixed(1),
          },
        });
      }
      expect(Math.abs(iso.T_logEta1_5 - p1.T_model_C)).toBeLessThan(glass.tolerance_model_C);
      expect(Math.abs(iso.T_logEta6_6 - p2.T_model_C)).toBeLessThan(glass.tolerance_model_C);
      expect(Math.abs(iso.T_logEta12  - p3.T_model_C)).toBeLessThan(glass.tolerance_model_C);
    });
  }

  it('produces strictly decreasing T with increasing viscosity for all validation glasses', () => {
    for (const glass of FLUEGEL_VALIDATION_GLASSES) {
      const iso = predictIsokomsFluegel(glass.composition_wt_pct);
      expect(iso.T_logEta1_5).toBeGreaterThan(iso.T_logEta6_6);
      expect(iso.T_logEta6_6).toBeGreaterThan(iso.T_logEta12);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Hetherington 1964 — Arrhenius formula self-check', () => {
  let service: GlassViscosityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlassViscosityService],
    }).compile();
    service = module.get<GlassViscosityService>(GlassViscosityService);
  });

  const A = -3.905;
  const B = 31400;
  const glass = HETHERINGTON_VALIDATION_GLASSES[0];

  for (const pt of glass.isokoms) {
    it(`T at log η=${pt.logEta} → ${pt.T_model_C}°C (±1°C)`, () => {
      const T_K = B / (pt.logEta - A);
      expect(T_K - 273.15).toBeCloseTo(pt.T_model_C, 0);
      const r = service.calculateViscosity(glass.composition_wt_pct, pt.T_model_C);
      expect(r.logViscosity).toBeCloseTo(pt.logEta, 1);
    });
  }

  it('uses ARRHENIUS model type', () => {
    expect(service.calculateViscosity({ SiO2: 100 }, 1800).model.type)
      .toBe(ViscosityModelType.ARRHENIUS);
  });

  it('fixed-point ordering: melting > working > softening > annealing > strain', () => {
    const fp = service.calculateViscosity({ SiO2: 100 }, 1800).fixedPoints;
    expect(fp.meltingPoint_C).toBeGreaterThan(fp.workingPoint_C);
    expect(fp.workingPoint_C).toBeGreaterThan(fp.softeningPoint_C);
    expect(fp.softeningPoint_C).toBeGreaterThan(fp.annealingPoint_C);
    expect(fp.annealingPoint_C).toBeGreaterThan(fp.strainPoint_C);
  });
});

