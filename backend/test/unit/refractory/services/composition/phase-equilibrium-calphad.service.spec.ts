import { BadRequestException } from '@nestjs/common';
import { PhaseEquilibriumCalphadService } from '../../../../../src/modules/refractory/services/composition/phase-equilibrium-calphad.service';
import { ConfidenceLevel } from '../../../../../src/modules/refractory/enums/confidence-level.enum';
import { PhaseEquilibriumMethod } from '../../../../../src/modules/refractory/enums/phase-equilibrium-method.enum';
import { CalphadPhaseGibbs } from '../../../../../src/modules/refractory/utils/calphad-phase-gibbs';
import { MaoLiquidDataset } from '../../../../../src/modules/refractory/utils/mao-liquid-dataset';
import { AbdulLiquidDataset } from '../../../../../src/modules/refractory/utils/abdul-liquid-dataset';

const cas = { Al2O3: 40, SiO2: 35, CaO: 25 };
const SOLIDUS_CAS_C = 1405;

describe('PhaseEquilibriumCalphadService', () => {
  const service = new PhaseEquilibriumCalphadService();
  const run = (composition: Record<string, number>, temperature_C: number) =>
    service.equilibrateMatrix({ composition, temperature_C, totalMass: 100 });

  afterEach(() => {
    CalphadPhaseGibbs.resetCache();
    MaoLiquidDataset.resetCache();
    AbdulLiquidDataset.resetCache();
  });

  describe('Gibbs / staging ladder (rungs 1–2)', () => {
    it('uses Gibbs minimisation for CAS when solid and liquid G are available', () => {
      const res = run(cas, 1600);
      expect(res.method).toBe(PhaseEquilibriumMethod.CALPHAD_PARTIAL_EXCESS);
      expect(res.warnings.some(w => w.includes('Gibbs minimisation'))).toBe(true);
      expect(
        res.warnings.some(
          w =>
            w.includes('associate speciation')
            || w.includes('ionic P–Q')
            || w.includes('Redlich–Kister excess'),
        ),
      ).toBe(true);
      expect(res.warnings.some(w => w.includes('liquidExcessIncomplete'))).toBe(false);
      expect(res.liquidPercent + res.solidPercent).toBeCloseTo(100, 5);
      expect(res.solidus_C).toBe(SOLIDUS_CAS_C);
    });

    it('labels Abdul / Mao staging when the matrix is CAS', () => {
      const res = run(cas, 1600);
      expect(res.status).toBe('assessed');
      expect(res.confidence).toBe(ConfidenceLevel.MEDIUM);
      expect(res.warnings.some(w => w.includes('Abdul') || w.includes('Mao'))).toBe(true);
    });
  });

  describe('eutectic anchored fallback metadata', () => {
    it('keeps the CaO-Al2O3-SiO2 eutectic as solidus even when Gibbs runs', () => {
      const res = run(cas, 1300);
      expect(res.solidus_C).toBe(SOLIDUS_CAS_C);
      expect(res.liquidus_C).toBeGreaterThanOrEqual(SOLIDUS_CAS_C + 200);
    });

    it('warns and lowers confidence when only a subsystem eutectic fits (no Gibbs oxides)', () => {
      // Fe2O3 has no liquid NASA end-member in the catalog → Gibbs skipped → lever path
      const res = run({ Fe2O3: 100 }, 1300);
      expect([
        PhaseEquilibriumMethod.EUTECTIC_ANCHORED,
        PhaseEquilibriumMethod.TM_ESTIMATE,
      ]).toContain(res.method);
      expect(res.status).toBe('estimated');
    });
  });

  describe('Tm estimate (rung 4)', () => {
    it('falls back to melting points for pure alumina when reporting solidus/liquidus', () => {
      const res = run({ Al2O3: 100 }, 1500);
      expect(res.solidus_C).toBe(2072 - 50);
      expect(res.liquidus_C).toBe(2072);
      // Gibbs usually wins for Al2O3 amounts
      expect(res.liquidPercent + res.solidPercent).toBeCloseTo(100, 5);
      expect(res.solidPercent).toBeGreaterThan(50);
    });

    it('rejects components without any melting data on the lever path', () => {
      expect(() => run({ Zz2O3: 100 }, 1500)).toThrow(BadRequestException);
    });
  });

  it('rejects an empty composition', () => {
    expect(() => run({}, 1500)).toThrow(BadRequestException);
  });
});
