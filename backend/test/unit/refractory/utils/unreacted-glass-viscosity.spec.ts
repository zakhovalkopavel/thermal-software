import { UnreactedPhaseState } from '../../../../src/modules/refractory/enums/unreacted-phase-state.enum';
import { ConfidenceLevel } from '../../../../src/modules/refractory/enums/confidence-level.enum';
import { ViscosityModel } from '../../../../src/modules/refractory/enums/viscosity-model.enum';
import type { PhaseEquilibriumUnreactedPhase } from '../../../../src/modules/refractory/types/phase-equilibrium-unreacted-phase.type';
import { UnreactedGlassViscosity } from '../../../../src/modules/refractory/utils/unreacted-glass-viscosity';

const viscosity = {
  model: ViscosityModel.IIDA,
  confidence: ConfidenceLevel.LOW,
  logViscosity: 2,
  viscosity_Pas: 100,
};

const glassCore = (overrides: Partial<PhaseEquilibriumUnreactedPhase> = {}): PhaseEquilibriumUnreactedPhase => ({
  materialId: 'chamotte_standard',
  phaseId: 'glass',
  phase: 'Glass (Chamotte)',
  formula: 'Chamotte',
  originalPercent: 40,
  originalMass: 40,
  unreactedPercent: 12,
  unreactedMass: 12,
  unreactedShare: 30,
  state: UnreactedPhaseState.UNCHANGED,
  composition: { Al2O3: 45, SiO2: 48, CaO: 1.5 },
  ...overrides,
});

const glassPoints = {
  model: ViscosityModel.FLUEGEL_2007,
  confidence: ConfidenceLevel.LOW,
  strainPoint_C: 1010,
  glassTransition_C: 1060,
  softeningPoint_C: 1330,
  workingPoint_C: 1650,
};

describe('UnreactedGlassViscosity', () => {
  it('attaches η(T) and glass points to amorphous cores only', () => {
    const crystal: PhaseEquilibriumUnreactedPhase = {
      ...glassCore({ phaseId: 'corundum', phase: 'Corundum', formula: 'Al2O3', composition: undefined }),
    };
    const evaluate = jest.fn().mockReturnValue({ viscosity, glassPoints });
    const { phases, warnings } = UnreactedGlassViscosity.attach([glassCore(), crystal], evaluate);
    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(phases[0].viscosity).toEqual(viscosity);
    expect(phases[0].glassPoints).toEqual(glassPoints);
    expect(phases[1].viscosity).toBeUndefined();
    expect(warnings).toEqual([]);
  });

  it('records a warning and null melt properties when evaluation throws', () => {
    const { phases, warnings } = UnreactedGlassViscosity.attach([glassCore()], () => {
      throw new Error('no model');
    });
    expect(phases[0].viscosity).toBeNull();
    expect(phases[0].glassPoints).toBeNull();
    expect(warnings[0]).toContain('chamotte_standard');
    expect(warnings[0]).toContain('no model');
  });
});
