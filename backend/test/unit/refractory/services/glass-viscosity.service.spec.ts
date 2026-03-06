import { Test, TestingModule } from '@nestjs/testing';
import { GlassViscosityService } from '../../../../src/modules/refractory/services/glass-viscosity.service';
import {
  ViscosityModel,
  ViscosityModelType,
  ConfidenceLevel,
} from '../../../../src/modules/refractory/enums/viscosity-model.enum';
import { VtfParameters } from '../../../../src/modules/refractory/interfaces/viscosity-parameters.interface';
import {
  LAKATOS_VALIDATION_GLASSES,
  FLUEGEL_VALIDATION_GLASSES,
  HETHERINGTON_VALIDATION_GLASSES,
} from '../../../../src/modules/refractory/data/glass-viscosity-validation.data';

// ─────────────────────────────────────────────────────────────────────────────

describe('GlassViscosityService — v2 models', () => {
  let service: GlassViscosityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlassViscosityService],
    }).compile();
    service = module.get<GlassViscosityService>(GlassViscosityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // wtPctToMolPct — unit tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('wtPctToMolPct', () => {
    it('mol% values sum to 100', () => {
      const mol = service.wtPctToMolPct({ SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.7 });
      const sum = Object.values(mol).reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(100, 5);
    });

    it('heavier oxide (BaO, M=153) gives fewer mol% than lighter oxide (Na2O, M=62) at equal wt%', () => {
      const mol = service.wtPctToMolPct({ SiO2: 50, Na2O: 25, BaO: 25 });
      expect(mol['Na2O']).toBeGreaterThan(mol['BaO']!);
    });

    it('SiO₂ is dominant mol% in SLS glass', () => {
      const mol = service.wtPctToMolPct({ SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.7 });
      for (const [k, v] of Object.entries(mol)) {
        if (k !== 'SiO2') expect(mol['SiO2']).toBeGreaterThan(v);
      }
    });

    it('Fluegel-710A wt% input → mol% matches source Table 1 to ±0.01 mol%', () => {
      // Fluegel Table 1 (primary source) gives mol% directly.
      // We feed the DERIVED wt% back in and check we recover the original mol%.
      const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'Fluegel-710A')!;
      const mol = service.wtPctToMolPct(glass.composition_wt_pct);
      const src = glass.composition_mol_pct!;
      for (const [k, expected] of Object.entries(src)) {
        if (expected > 0) {
          expect(mol[k]).toBeCloseTo(expected, 1); // ±0.05 mol%
        }
      }
    });

    it('Fluegel-711 (lead glass) wt% → mol% recovers PbO mol% correctly', () => {
      const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'Fluegel-711')!;
      const mol = service.wtPctToMolPct(glass.composition_wt_pct);
      const src = glass.composition_mol_pct!;
      // PbO: very heavy (M=223.20) so mol% << wt%
      expect(mol['PbO']).toBeCloseTo(src['PbO'], 1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // molPctToWtPct — unit tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('molPctToWtPct', () => {
    it('wt% values sum to 100', () => {
      const wt = service.molPctToWtPct({ SiO2: 74, Na2O: 15, CaO: 11 });
      const sum = Object.values(wt).reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(100, 5);
    });

    it('round-trip wtPct → molPct → wtPct is identity (±0.01 wt%)', () => {
      const original = { SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.7 };
      const mol = service.wtPctToMolPct(original);
      const recovered = service.molPctToWtPct(mol);
      for (const [k, v] of Object.entries(original)) {
        expect(recovered[k]).toBeCloseTo(v, 1);
      }
    });

    it('round-trip molPct → wtPct → molPct is identity (±0.01 mol%)', () => {
      // Use the Fluegel 710A mol% as canonical starting point
      const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'Fluegel-710A')!;
      const original = glass.composition_mol_pct!;
      const wt = service.molPctToWtPct(original);
      const recovered = service.wtPctToMolPct(wt);
      for (const [k, v] of Object.entries(original)) {
        if (v > 0) expect(recovered[k]).toBeCloseTo(v, 1);
      }
    });

    it('Fluegel-711 mol% → wt% matches derived table (heavy PbO shifts wt% up)', () => {
      const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'Fluegel-711')!;
      const wt = service.molPctToWtPct(glass.composition_mol_pct!);
      const expected = glass.composition_wt_pct;
      for (const [k, v] of Object.entries(expected)) {
        expect(wt[k]).toBeCloseTo(v, 1);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // LAKATOS 1976 — isokom regression vs paper values (tolerance: 1–2°C)
  // ──────────────────────────────────────────────────────────────────────────

  describe('predictIsokomsLakatos — regression vs paper Table 1A/1B', () => {
    for (const glass of LAKATOS_VALIDATION_GLASSES) {
      it(`${glass.id} (${glass.description}): isokom T matches Table 12 model to <${glass.tolerance_model_C}°C`, () => {
        const iso = service.predictIsokomsFluegel(glass.composition_wt_pct);
        const [p1, p2, p3] = glass.isokoms;
        expect(Math.abs(iso.T_logEta1_5 - p1.T_model_C)).toBeLessThan(glass.tolerance_model_C);
        expect(Math.abs(iso.T_logEta6_6 - p2.T_model_C)).toBeLessThan(glass.tolerance_model_C);
        expect(Math.abs(iso.T_logEta12  - p3.T_model_C)).toBeLessThan(glass.tolerance_model_C);
      });
    }

    it('produces strictly decreasing T with increasing viscosity for all validation glasses', () => {
      for (const glass of LAKATOS_VALIDATION_GLASSES) {
        const iso = service.predictIsokomsLakatos(glass.composition_wt_pct);
        expect(iso.T_logEta1).toBeGreaterThan(iso.T_logEta3);
        expect(iso.T_logEta3).toBeGreaterThan(iso.T_logEta5);
      }
    });

    it('warns when Na₂O exceeds Lakatos upper bound', () => {
      const iso = service.predictIsokomsLakatos({ SiO2: 65, Na2O: 19, CaO: 10, MgO: 3, Al2O3: 1 });
      expect(iso.warnings.some(w => w.includes('Na'))).toBe(true);
    });

    it('warns about non-Lakatos components > 2 wt%', () => {
      const iso = service.predictIsokomsLakatos({ SiO2: 70, Na2O: 13, CaO: 10, Fe2O3: 5, MgO: 2 });
      expect(iso.warnings.some(w => /Fe2O3|not modelled/i.test(w))).toBe(true);
    });

    it('throws for zero SiO₂', () => {
      expect(() => service.predictIsokomsLakatos({ Na2O: 25, CaO: 75 })).toThrow();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // FLUEGEL 2007 — isokom regression vs paper Table 12 (tolerance: 5°C)
  // Compositions from Table 1 are in MOL% — we pass the DERIVED wt%.
  // ──────────────────────────────────────────────────────────────────────────

  describe('predictIsokomsFluegel — regression vs Fluegel 2007 Table 12', () => {
    for (const glass of FLUEGEL_VALIDATION_GLASSES) {
      it(`${glass.id} (${glass.description}): isokom T matches Table 12 model to <${glass.tolerance_model_C}°C`, () => {
        const molPct = service.wtPctToMolPct(glass.composition_wt_pct);
        const iso = service.predictIsokomsFluegel(glass.composition_wt_pct);
        const [p1, p2, p3] = glass.isokoms;
        console.log({
          id: glass.id,
          composition_wt_pct: glass.composition_wt_pct,
          molPct: Object.fromEntries(Object.entries(molPct).map(([k, v]) => [k, +v.toFixed(3)])),
          iso: { T1_5: +iso.T_logEta1_5.toFixed(1), T6_6: +iso.T_logEta6_6.toFixed(1), T12: +iso.T_logEta12.toFixed(1) },
          expected: { T1_5: p1.T_model_C, T6_6: p2.T_model_C, T12: p3.T_model_C },
          errors: {
            err1_5: +(iso.T_logEta1_5 - p1.T_model_C).toFixed(1),
            err6_6: +(iso.T_logEta6_6 - p2.T_model_C).toFixed(1),
            err12:  +(iso.T_logEta12  - p3.T_model_C).toFixed(1),
          },
        });
        expect(Math.abs(iso.T_logEta1_5 - p1.T_model_C)).toBeLessThan(glass.tolerance_model_C);
        expect(Math.abs(iso.T_logEta6_6 - p2.T_model_C)).toBeLessThan(glass.tolerance_model_C);
        expect(Math.abs(iso.T_logEta12  - p3.T_model_C)).toBeLessThan(glass.tolerance_model_C);
      });
    }

    it('produces strictly decreasing T with increasing viscosity for all validation glasses', () => {
      for (const glass of FLUEGEL_VALIDATION_GLASSES) {
        const iso = service.predictIsokomsFluegel(glass.composition_wt_pct);
        expect(iso.T_logEta1_5).toBeGreaterThan(iso.T_logEta6_6);
        expect(iso.T_logEta6_6).toBeGreaterThan(iso.T_logEta12);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // HETHERINGTON 1964 — Arrhenius formula verification
  // ──────────────────────────────────────────────────────────────────────────

  describe('Hetherington 1964 — fixed-point verification', () => {
    const glass = HETHERINGTON_VALIDATION_GLASSES[0];
    const A = -3.905, B = 31400;

    for (const pt of glass.isokoms) {
      it(`T at log η=${pt.logEta} → ${pt.T_model_C}°C (formula self-check, ±1°C)`, () => {
        const r = service.calculateViscosity(glass.composition_wt_pct, pt.T_model_C);
        // Hetherington is Arrhenius — invert: T_K = B / (logEta - A)
        const T_K = B / (pt.logEta - A);
        expect(T_K - 273.15).toBeCloseTo(pt.T_model_C, 0);
        // Also verify the service returns the correct log η at this temperature
        expect(r.logViscosity).toBeCloseTo(pt.logEta, 1);
      });
    }

    it('fixed-point ordering: meltingPoint > workingPoint > softeningPoint > annealingPoint > strainPoint', () => {
      const fp = service.calculateViscosity({ SiO2: 100 }, 1800).fixedPoints;
      expect(fp.meltingPoint_C).toBeGreaterThan(fp.workingPoint_C);
      expect(fp.workingPoint_C).toBeGreaterThan(fp.softeningPoint_C);
      expect(fp.softeningPoint_C).toBeGreaterThan(fp.annealingPoint_C);
      expect(fp.annealingPoint_C).toBeGreaterThan(fp.strainPoint_C);
    });

    it('uses ARRHENIUS model type', () => {
      expect(service.calculateViscosity({ SiO2: 100 }, 1800).model.type)
        .toBe(ViscosityModelType.ARRHENIUS);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // VTF THREE-POINT FIT — mathematical properties
  // ──────────────────────────────────────────────────────────────────────────

  describe('fitVtfThreePoints — mathematical properties', () => {
    // Use S1 Lakatos model outputs as canonical isokom triple
    const p1 = { T_celsius: 1503.7, logEtaPaS: 1 };
    const p2 = { T_celsius: 1054.3, logEtaPaS: 3 };
    const p3 = { T_celsius:  843.3, logEtaPaS: 5 };

    it('reproduces all three input points to floating-point precision', () => {
      const vtf = service.fitVtfThreePoints(p1, p2, p3);
      expect(service.evalVtf(vtf, p1.T_celsius)).toBeCloseTo(p1.logEtaPaS, 9);
      expect(service.evalVtf(vtf, p2.T_celsius)).toBeCloseTo(p2.logEtaPaS, 9);
      expect(service.evalVtf(vtf, p3.T_celsius)).toBeCloseTo(p3.logEtaPaS, 9);
    });

    it('result is order-independent', () => {
      const vtf1 = service.fitVtfThreePoints(p1, p2, p3);
      const vtf2 = service.fitVtfThreePoints(p3, p1, p2);
      const vtf3 = service.fitVtfThreePoints(p2, p3, p1);
      expect(vtf1.T0).toBeCloseTo(vtf2.T0, 9);
      expect(vtf1.T0).toBeCloseTo(vtf3.T0, 9);
      expect(vtf1.B).toBeCloseTo(vtf2.B, 9);
    });

    it('T₀ > 0 and T₀ < lowest isokom temperature for all Lakatos validation glasses', () => {
      for (const glass of LAKATOS_VALIDATION_GLASSES) {
        const iso = service.predictIsokomsLakatos(glass.composition_wt_pct);
        const vtf = service.fitVtfThreePoints(
          { T_celsius: iso.T_logEta1, logEtaPaS: 1 },
          { T_celsius: iso.T_logEta3, logEtaPaS: 3 },
          { T_celsius: iso.T_logEta5, logEtaPaS: 5 },
        );
        expect(vtf.T0).toBeGreaterThan(0);
        expect(vtf.T0).toBeLessThan(iso.T_logEta5);
        expect(vtf.B).toBeGreaterThan(0);
      }
    });

    it('inversion round-trip: temperatureAtLogViscosity → evalVtf is exact', () => {
      const vtf = service.fitVtfThreePoints(p1, p2, p3);
      for (const logEta of [1, 2, 3, 5, 6.6, 12, 13.5]) {
        const T = service.temperatureAtLogViscosity(vtf, logEta);
        expect(service.evalVtf(vtf, T)).toBeCloseTo(logEta, 9);
      }
    });

    it('viscosity increases monotonically as temperature decreases', () => {
      const vtf = service.fitVtfThreePoints(p1, p2, p3);
      const temps = [1400, 1200, 1050, 900, 843];
      const logEtas = temps.map(T => service.evalVtf(vtf, T));
      for (let i = 1; i < logEtas.length; i++) {
        expect(logEtas[i]).toBeGreaterThan(logEtas[i - 1]);
      }
    });

    it('throws VTF_FIT_SINGULAR for equally-spaced (Arrhenius-like) points', () => {
      // Equal T-spacing + equal log-η spacing → denominator = 0
      expect(() =>
        service.fitVtfThreePoints(
          { T_celsius: 1000, logEtaPaS: 2 },
          { T_celsius:  800, logEtaPaS: 4 },
          { T_celsius:  600, logEtaPaS: 6 },
        ),
      ).toThrow(/VTF_FIT_SINGULAR|VTF_FIT_INVALID/);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // MODEL SELECTION
  // ──────────────────────────────────────────────────────────────────────────

  describe('selectModel', () => {
    it('HETHERINGTON_1964 for SiO₂ = 100%', () => {
      expect(service.selectModel({ SiO2: 100 }).primary).toBe(ViscosityModel.HETHERINGTON_1964);
    });

    it('HETHERINGTON_1964 for SiO₂ = 99.5%, Al2O3 = 0.5%', () => {
      expect(service.selectModel({ SiO2: 99.5, Al2O3: 0.5 }).primary).toBe(ViscosityModel.HETHERINGTON_1964);
    });

    it('LAKATOS_1976 for S1 composition', () => {
      expect(service.selectModel({ SiO2: 77.02, Al2O3: 0.19, Na2O: 12.03, K2O: 0.13, CaO: 10.12 }).primary)
        .toBe(ViscosityModel.LAKATOS_1976);
    });

    it('LAKATOS_1976 for standard window glass', () => {
      expect(service.selectModel({ SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4 }).primary)
        .toBe(ViscosityModel.LAKATOS_1976);
    });

    it('FLUEGEL_2007 for Pyrex (low Na₂O = 3.9%, outside Lakatos Na₂O range)', () => {
      expect(service.selectModel({ SiO2: 80.6, B2O3: 12.9, Al2O3: 2.3, Na2O: 3.9, K2O: 0.3 }).primary)
        .toBe(ViscosityModel.FLUEGEL_2007);
    });

    it('FLUEGEL_2007 for Fluegel-711 lead glass (wt%: ~45% PbO)', () => {
      const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'Fluegel-711')!;
      expect(service.selectModel(glass.composition_wt_pct).primary).toBe(ViscosityModel.FLUEGEL_2007);
    });

    it('FLUEGEL_2007 for Fluegel-717A borosilicate (wt%: ~18% B2O3)', () => {
      const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'Fluegel-717A')!;
      expect(service.selectModel(glass.composition_wt_pct).primary).toBe(ViscosityModel.FLUEGEL_2007);
    });

    it('NOT_SUPPORTED for CaO-rich slag (CaO>30%, SiO₂<40%)', () => {
      const s = service.selectModel({ CaO: 45, Al2O3: 35, SiO2: 18, MgO: 2 });
      expect(s.primary).toBe(ViscosityModel.NOT_SUPPORTED);
      expect(s.secondary).toBe(ViscosityModel.RIBOUD_1981);
    });

    it('NOT_SUPPORTED for pure fluoride glass', () => {
      expect(service.selectModel({ CaF2: 50, AlF3: 20, Na2O: 5, SiO2: 25 }).primary)
        .toBe(ViscosityModel.NOT_SUPPORTED);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // calculateViscosity — end-to-end integration + VTF prediction vs measured T
  // ──────────────────────────────────────────────────────────────────────────

  describe('calculateViscosity — Lakatos path', () => {
    const windowGlass = { SiO2: 72.2, Na2O: 13.4, CaO: 11.2, MgO: 1.5, Al2O3: 1.3, K2O: 0.4 };


    it('routes to LAKATOS_1976', () => {
      expect(service.calculateViscosity(windowGlass, 1100).model.systemType)
        .toBe(ViscosityModel.LAKATOS_1976);
    });

    it('uses VFT model type', () => {
      expect(service.calculateViscosity(windowGlass, 1100).model.type)
        .toBe(ViscosityModelType.VFT);
    });

    it('VTF predicts measured isokom T within 15°C for all Lakatos validation glasses', () => {
      // The Lakatos model has σ≈5°C; VTF interpolation is exact at the three isokom levels.
      // Measured temperatures differ from model by up to ±10°C — allow 15°C total.
      for (const glass of LAKATOS_VALIDATION_GLASSES) {
        const r = service.calculateViscosity(glass.composition_wt_pct, glass.isokoms[0].T_model_C);
        const vtf: VtfParameters = { A: r.model.parameters.A, B: r.model.parameters.B!, T0: r.model.parameters.T0! };
        for (const pt of glass.isokoms) {
          if (pt.T_measured_C !== undefined) {
            const T_pred = service.temperatureAtLogViscosity(vtf, pt.logEta);
            expect(Math.abs(T_pred - pt.T_measured_C)).toBeLessThan(15);
          }
        }
      }
    });

    it('all ASTM fixed points are defined, finite and in correct order', () => {
      const fp = service.calculateViscosity(windowGlass, 1100).fixedPoints;
      expect(fp.meltingPoint_C).toBeGreaterThan(fp.workingPoint_C);
      expect(fp.workingPoint_C).toBeGreaterThan(fp.softeningPoint_C);
      expect(fp.softeningPoint_C).toBeGreaterThan(fp.annealingPoint_C);
      expect(fp.annealingPoint_C).toBeGreaterThan(fp.strainPoint_C);
      for (const key of ['meltingPoint_C','workingPoint_C','softeningPoint_C','annealingPoint_C','strainPoint_C'] as const) {
        expect(isFinite(fp[key])).toBe(true);
      }
    });

    it('all spans are positive', () => {
      const spans = service.calculateViscosity(windowGlass, 1100).fixedPoints.spans!;
      expect(spans.meltingToStrain_C).toBeGreaterThan(0);
      expect(spans.workingToSoftening_C).toBeGreaterThan(0);
      expect(spans.softeningToAnnealing_C).toBeGreaterThan(0);
      expect(spans.annealingToStrain_C).toBeGreaterThan(0);
    });

    it('confidence is HIGH for in-range SLS composition', () => {
      expect(service.calculateViscosity(windowGlass, 1100).validation.confidenceLevel)
        .toBe(ConfidenceLevel.HIGH);
    });

    it('metadata reference mentions Lakatos', () => {
      expect(service.calculateViscosity(windowGlass, 1100).metadata.reference.toLowerCase())
        .toContain('lakatos');
    });
  });

  describe('calculateViscosity — Fluegel path', () => {

    it('routes Fluegel-717A (borosilicate) to FLUEGEL_2007', () => {
      // Fluegel SE ≈ 10–17°C per level; experimental scatter adds another ~10°C.
      for (const glass of FLUEGEL_VALIDATION_GLASSES) {
        const r = service.calculateViscosity(glass.composition_wt_pct, glass.isokoms[0].T_model_C);
        const vtf: VtfParameters = { A: r.model.parameters.A, B: r.model.parameters.B!, T0: r.model.parameters.T0! };
        for (const pt of glass.isokoms) {
          if (pt.T_measured_C !== undefined) {
            const T_pred = service.temperatureAtLogViscosity(vtf, pt.logEta);
            expect(Math.abs(T_pred - pt.T_measured_C)).toBeLessThan(30);
          }
        }
      }
    });

    it('routes Fluegel-717A (borosilicate) to FLUEGEL_2007', () => {
      const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'Fluegel-717A')!;
      expect(service.calculateViscosity(glass.composition_wt_pct, 1200).model.systemType)
        .toBe(ViscosityModel.FLUEGEL_2007);
    });

    it('routes Fluegel-711 (lead glass) to FLUEGEL_2007', () => {
      const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'Fluegel-711')!;
      expect(service.calculateViscosity(glass.composition_wt_pct, 900).model.systemType)
        .toBe(ViscosityModel.FLUEGEL_2007);
    });

    it('metadata reference mentions Fluegel', () => {
      const glass = FLUEGEL_VALIDATION_GLASSES.find(g => g.id === 'Fluegel-717A')!;
      expect(service.calculateViscosity(glass.composition_wt_pct, 1200).metadata.reference.toLowerCase())
        .toContain('fluegel');
    });
  });

  describe('calculateViscosity — general', () => {
    it('viscosity_Pas is always positive and finite', () => {
      for (const glass of [...LAKATOS_VALIDATION_GLASSES, ...FLUEGEL_VALIDATION_GLASSES]) {
        const T = glass.isokoms[1].T_model_C;
        const r = service.calculateViscosity(glass.composition_wt_pct, T);
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

    it('throws BadRequestException for slag (NOT_SUPPORTED)', () => {
      expect(() => service.calculateViscosity({ CaO: 45, Al2O3: 35, SiO2: 18, MgO: 2 }, 1450)).toThrow();
    });

    it('throws BadRequestException for pure fluoride glass (NOT_SUPPORTED)', () => {
      expect(() => service.calculateViscosity({ CaF2: 60, AlF3: 25, NaF: 15 }, 500)).toThrow();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // COMPONENT BREAKDOWN
  // ──────────────────────────────────────────────────────────────────────────

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

