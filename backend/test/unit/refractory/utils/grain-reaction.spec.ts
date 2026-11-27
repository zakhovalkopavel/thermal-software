import { GrainReaction } from '../../../../src/modules/refractory/utils/grain-reaction';
import { GRAIN_REACTION_CONSTANTS } from '../../../../src/modules/refractory/constants/grain-reaction.constants';

const ACTIVATION_ENERGY_JMOL = 300_000;
const REF_T_C = GRAIN_REACTION_CONSTANTS.referenceTemperature_C;
const REF_T_HOURS = GRAIN_REACTION_CONSTANTS.referenceHoldTime_hours;

describe('GrainReaction.penetrationDepth_mm', () => {
  it('equals δ_ref at the reference firing (1450 °C, 2 h)', () => {
    expect(GrainReaction.penetrationDepth_mm(ACTIVATION_ENERGY_JMOL, REF_T_C, REF_T_HOURS)).toBeCloseTo(0.1, 12);
  });

  it('scales with √t at the reference temperature', () => {
    const delta = GrainReaction.penetrationDepth_mm(ACTIVATION_ENERGY_JMOL, REF_T_C, 4 * REF_T_HOURS);
    expect(delta).toBeCloseTo(0.2, 12);
  });

  it('grows with temperature and shrinks below the reference', () => {
    const hot = GrainReaction.penetrationDepth_mm(ACTIVATION_ENERGY_JMOL, REF_T_C + 100, REF_T_HOURS);
    const cold = GrainReaction.penetrationDepth_mm(ACTIVATION_ENERGY_JMOL, REF_T_C - 100, REF_T_HOURS);
    expect(hot).toBeGreaterThan(0.1);
    expect(cold).toBeLessThan(0.1);
  });

  it('is independent of activation energy at the reference temperature', () => {
    const a = GrainReaction.penetrationDepth_mm(1e5, REF_T_C, REF_T_HOURS);
    const b = GrainReaction.penetrationDepth_mm(5e5, REF_T_C, REF_T_HOURS);
    expect(a).toBeCloseTo(b, 12);
  });
});

describe('GrainReaction.reactedFraction (reference firing 1450 °C, 2 h)', () => {
  const delta = GrainReaction.penetrationDepth_mm(ACTIVATION_ENERGY_JMOL, REF_T_C, REF_T_HOURS);

  it.each([
    [0.1, 0, 1],
    [0.5, 0.216, 0.22],
    [5, 0.8847, 0.88],
  ])('d50 = %d mm → unreacted ≈ %d', (d50, unreactedExact, unreactedApprox) => {
    const unreacted = 1 - GrainReaction.reactedFraction(d50, delta);
    expect(unreacted).toBeCloseTo(unreactedExact, 3);
    expect(unreacted).toBeCloseTo(unreactedApprox, 1);
  });

  it('returns 1 when 2δ equals d50 and 0 for zero penetration', () => {
    expect(GrainReaction.reactedFraction(0.2, 0.1)).toBe(1);
    expect(GrainReaction.reactedFraction(1, 0)).toBe(0);
  });
});
