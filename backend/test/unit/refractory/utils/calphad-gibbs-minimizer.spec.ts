import { AbdulLiquidDataset } from '../../../../src/modules/refractory/utils/abdul-liquid-dataset';
import { AbdulLiquidExcess } from '../../../../src/modules/refractory/utils/abdul-liquid-excess';
import { CalphadGibbsMinimizer } from '../../../../src/modules/refractory/utils/calphad-gibbs-minimizer';
import { CalphadPhaseGibbs } from '../../../../src/modules/refractory/utils/calphad-phase-gibbs';
import { MaoLiquid } from '../../../../src/modules/refractory/utils/mao-liquid';
import { MaoLiquidDataset } from '../../../../src/modules/refractory/utils/mao-liquid-dataset';

describe('CalphadGibbsMinimizer', () => {
  afterEach(() => {
    CalphadPhaseGibbs.resetCache();
    MaoLiquidDataset.resetCache();
    AbdulLiquidDataset.resetCache();
  });

  it('returns a solid-dominated solution for pure alumina below Tm', () => {
    const solution = CalphadGibbsMinimizer.minimize({ Al2O3: 100 }, 1500);
    expect(solution).toBeDefined();
    expect(solution!.solidPercent).toBeGreaterThan(90);
    expect(solution!.crystals.some(c => c.phaseId === 'corundum')).toBe(true);
    expect(solution!.residualMax_mol).toBeLessThan(1e-3);
    expect(solution!.usedAbdulExcess).toBe(false);
  });

  it('conserves oxide mass for a CAS composition and flags a CAS liquid excess mode', () => {
    const bulk = { Al2O3: 40, SiO2: 35, CaO: 25 };
    const solution = CalphadGibbsMinimizer.minimize(bulk, 1600);
    expect(solution).toBeDefined();
    expect(
      solution!.usedAssociateSpeciation || solution!.usedMaoIonic || solution!.usedAbdulExcess,
    ).toBe(true);
    expect(solution!.liquidPercent + solution!.solidPercent).toBeCloseTo(100, 5);
    const f = solution!.liquidPercent / 100;
    for (const oxide of Object.keys(bulk)) {
      const liquid = solution!.liquidComposition[oxide] ?? 0;
      const solid = solution!.solidComposition[oxide] ?? 0;
      if (solution!.liquidPercent < 0.05) {
        expect(solid).toBeCloseTo(bulk[oxide as keyof typeof bulk], 0);
      } else if (solution!.solidPercent < 0.05) {
        expect(liquid).toBeCloseTo(bulk[oxide as keyof typeof bulk], 0);
      } else {
        expect(f * liquid + (1 - f) * solid).toBeCloseTo(bulk[oxide as keyof typeof bulk], 0);
      }
    }
  });

  it('skips oxides without a liquid NASA end-member', () => {
    expect(CalphadGibbsMinimizer.minimize({ Zz2O3: 100 }, 1500)).toBeUndefined();
  });
});

describe('MaoLiquid', () => {
  afterEach(() => MaoLiquidDataset.resetCache());

  it('evaluates SiO2 liquid oxideG at 1800 °C', () => {
    const G = MaoLiquid.oxideGibbs_Jmol('SiO2', 1800);
    expect(Number.isFinite(G)).toBe(true);
    expect(G).toBeLessThan(0);
  });

  it('detects CAS coverage', () => {
    expect(MaoLiquid.coversCas({ CaO: 30, Al2O3: 35, SiO2: 35 })).toBe(true);
    expect(MaoLiquid.coversCas({ CaO: 20, Al2O3: 30, SiO2: 40, Na2O: 10 })).toBe(false);
  });
});

describe('AbdulLiquidExcess', () => {
  afterEach(() => AbdulLiquidDataset.resetCache());

  it('returns finite CAS Redlich–Kister excess for mixed liquid moles', () => {
    const gEx = AbdulLiquidExcess.excessGibbs_J({ Al2O3: 0.2, CaO: 0.3, SiO2: 0.5 }, 1800);
    expect(Number.isFinite(gEx)).toBe(true);
  });

  it('maps Al2O3 to 2 ALL species moles', () => {
    expect(AbdulLiquidExcess.toSpeciesMoles({ Al2O3: 1, CaO: 1, SiO2: 1 })).toEqual({
      ALL: 2,
      CAOL: 1,
      SIO2L: 1,
    });
  });
});
