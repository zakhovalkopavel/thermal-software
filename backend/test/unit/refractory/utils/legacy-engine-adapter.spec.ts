import { LegacyEngineAdapter } from '../../../../src/modules/refractory/utils/legacy-engine-adapter';
import { PhaseEquilibriumMethod } from '../../../../src/modules/refractory/enums/phase-equilibrium-method.enum';
import type { PhaseEquilibriumLegacyResult } from '../../../../src/modules/refractory/types/phase-equilibrium-legacy-result.type';

const legacy = (mineralPhases: string[], solidPercent: number): PhaseEquilibriumLegacyResult => ({
  liquid: { percent: 100 - solidPercent, mass: 0, composition: { CaO: 100 }, components: {} },
  solid: { percent: solidPercent, mass: 0, composition: { Al2O3: 100 }, mineralPhases, components: {} },
  metadata: { temperature: 1500, totalMass: 100, eutecticTemperature: 1265, estimatedLiquidus: 1700, calculatedAt: new Date() },
  warnings: ['note'],
});

describe('LegacyEngineAdapter', () => {
  it('maps liquid, solid, temperatures and warnings', () => {
    const res = LegacyEngineAdapter.toEngineResult(legacy(['Corundum (α-Al₂O₃)'], 80));
    expect(res.method).toBe(PhaseEquilibriumMethod.LEGACY_EUTECTIC);
    expect(res.liquidPercent).toBe(20);
    expect(res.solidus_C).toBe(1265);
    expect(res.liquidus_C).toBe(1700);
    expect(res.warnings).toEqual(['note']);
  });

  it('splits the solid equally between the named phases and strips the polymorph prefix', () => {
    const { crystals } = LegacyEngineAdapter.toEngineResult(
      legacy(['Corundum (α-Al₂O₃)', 'Mullite (3Al₂O₃·2SiO₂)'], 80),
    );
    expect(crystals.map(c => c.phaseId)).toEqual(['corundum', 'mullite']);
    expect(crystals[0].formula).toBe('Al₂O₃');
    expect(crystals[0].percent).toBe(40);
  });

  it('reports no crystals for the fallback phase name or without solid', () => {
    expect(LegacyEngineAdapter.toEngineResult(legacy(['Mixed solid solution'], 80)).crystals).toEqual([]);
    expect(LegacyEngineAdapter.toEngineResult(legacy(['Corundum (α-Al₂O₃)'], 0)).crystals).toEqual([]);
  });
});
