import { PHASE_EQUILIBRIUM_RESPONSE_CONSTANTS } from '../constants/phase-equilibrium-response.constants';
import { UNREACTED_PHASE_CONSTANTS } from '../constants/unreacted-phase.constants';
import { PhasePartSource } from '../enums/phase-part-source.enum';
import type { PhaseEquilibriumResponse } from '../types/phase-equilibrium-response.type';
import type { PhaseEquilibriumResponseBlock } from '../types/phase-equilibrium-response-block.type';
import type { PhaseEquilibriumResponseCrystal } from '../types/phase-equilibrium-response-crystal.type';
import type { PhaseEquilibriumResponseInput } from '../types/phase-equilibrium-response-input.type';
import type { PhaseEquilibriumResponsePart } from '../types/phase-equilibrium-response-part.type';
import type { PhaseEquilibriumUnreactedPhase } from '../types/phase-equilibrium-unreacted-phase.type';

const { decimals, percentFactor } = PHASE_EQUILIBRIUM_RESPONSE_CONSTANTS;

/**
 * Assembles the API result from the matrix equilibrium and the unreacted grain cores.
 * All amounts are % of the fired body; `mass = percent / 100 · totalMass`.
 */
export class PhaseEquilibriumResponseBuilder {
  static build(input: PhaseEquilibriumResponseInput): PhaseEquilibriumResponse {
    const { engine, matrix, unreacted, states, totalMass } = input;
    const matrixLiquid = (matrix.percent * engine.liquidPercent) / percentFactor;
    const liquidParts = matrixLiquid > 0 ? [PhaseEquilibriumResponseBuilder.liquidPart(input, matrixLiquid)] : [];
    const glassParts = PhaseEquilibriumResponseBuilder.glassParts(unreacted, totalMass);
    const matrixCrystals = PhaseEquilibriumResponseBuilder.matrixCrystals(input);
    const crystals = PhaseEquilibriumResponseBuilder.mergeCrystals(matrixCrystals, unreacted, totalMass);
    const liquid = PhaseEquilibriumResponseBuilder.block(liquidParts, totalMass);
    return {
      atTemperature: { liquid, glass: PhaseEquilibriumResponseBuilder.block(glassParts, totalMass), crystals },
      afterCooling: {
        glass: PhaseEquilibriumResponseBuilder.block(
          PhaseEquilibriumResponseBuilder.quench(liquidParts, input.liquidGlassPoints).concat(glassParts),
          totalMass,
        ),
        crystals,
      },
      unreactedOriginalPhases: unreacted.map(u => PhaseEquilibriumResponseBuilder.roundUnreacted(u)),
      fractions: states.map(s => ({
        materialId: s.material.materialId,
        d50_mm: s.d50_mm,
        massFraction: PhaseEquilibriumResponseBuilder.round(s.massFraction),
        penetrationDepth_mm: PhaseEquilibriumResponseBuilder.round(s.penetrationDepth_mm),
        reactedPercent: PhaseEquilibriumResponseBuilder.round(s.reactedFraction * percentFactor),
      })),
      matrix: {
        percent: PhaseEquilibriumResponseBuilder.round(matrix.percent),
        composition: PhaseEquilibriumResponseBuilder.roundComposition(matrix.composition),
        system: Object.keys(matrix.composition).sort().join('-'),
        method: engine.method,
        solidus_C: Math.round(engine.solidus_C),
        liquidus_C: Math.round(engine.liquidus_C),
        atTemperature: { liquid, crystals: matrixCrystals },
        afterCooling: { glass: PhaseEquilibriumResponseBuilder.block(liquidParts, totalMass), crystals: matrixCrystals },
      },
      metadata: {
        engine: input.mode,
        method: engine.method,
        confidence: engine.confidence,
        temperature: input.temperature,
        holdTime_hours: input.holdTime_hours,
        totalMass,
        reactedPercent: PhaseEquilibriumResponseBuilder.round(matrix.percent),
        calculatedAt: new Date(),
        ...(input.comparison ? { comparison: input.comparison } : {}),
      },
      warnings: [...input.warnings, ...matrix.warnings, ...engine.warnings],
    };
  }

  private static liquidPart(input: PhaseEquilibriumResponseInput, percent: number): PhaseEquilibriumResponsePart {
    return {
      source: PhasePartSource.MATRIX,
      name: 'Liquid (matrix)',
      percent,
      mass: (percent / percentFactor) * input.totalMass,
      composition: input.engine.liquidComposition,
      viscosity: input.viscosity,
      glassPoints: null,
    };
  }

  /** Matrix liquid frozen to glass on cooling; η at T no longer applies, glass points remain. */
  private static quench(
    liquidParts: PhaseEquilibriumResponsePart[],
    glassPoints: PhaseEquilibriumResponseInput['liquidGlassPoints'],
  ): PhaseEquilibriumResponsePart[] {
    return liquidParts.map(p => ({
      ...p,
      name: 'Glass (matrix liquid)',
      viscosity: undefined,
      glassPoints,
    }));
  }

  private static glassParts(unreacted: PhaseEquilibriumUnreactedPhase[], totalMass: number): PhaseEquilibriumResponsePart[] {
    return unreacted
      .filter(u => u.phaseId === UNREACTED_PHASE_CONSTANTS.glassPhaseId && u.unreactedPercent > UNREACTED_PHASE_CONSTANTS.minPercent)
      .map(u => ({
        source: PhasePartSource.UNREACTED,
        materialId: u.materialId,
        phaseId: u.phaseId,
        name: u.phase,
        percent: u.unreactedPercent,
        mass: (u.unreactedPercent / percentFactor) * totalMass,
        composition: u.composition ?? {},
        state: u.state,
        viscosity: u.viscosity ?? null,
        glassPoints: u.glassPoints ?? null,
      }));
  }

  /** Crystals of the matrix solid, % of the fired body. */
  private static matrixCrystals(input: PhaseEquilibriumResponseInput): PhaseEquilibriumResponseCrystal[] {
    return input.engine.crystals.map(c => {
      const percent = (input.matrix.percent * c.percent) / percentFactor;
      return {
        phaseId: c.phaseId,
        phase: c.phase,
        formula: c.formula,
        percent: PhaseEquilibriumResponseBuilder.round(percent),
        mass: PhaseEquilibriumResponseBuilder.round((percent / percentFactor) * input.totalMass),
        origin: { matrix: PhaseEquilibriumResponseBuilder.round(percent), unreactedUnchanged: 0, unreactedTransformed: 0 },
      };
    });
  }

  /** Matrix crystals plus unreacted crystalline cores, merged by phase id. */
  private static mergeCrystals(
    matrixCrystals: PhaseEquilibriumResponseCrystal[],
    unreacted: PhaseEquilibriumUnreactedPhase[],
    totalMass: number,
  ): PhaseEquilibriumResponseCrystal[] {
    const merged = new Map<string, PhaseEquilibriumResponseCrystal>(
      matrixCrystals.map(c => [c.phaseId, { ...c, origin: { ...c.origin } }]),
    );
    for (const u of unreacted.filter(p => p.phaseId !== UNREACTED_PHASE_CONSTANTS.glassPhaseId)) {
      const crystal = merged.get(u.phaseId) ?? {
        phaseId: u.phaseId, phase: u.phase, formula: u.formula, percent: 0, mass: 0,
        origin: { matrix: 0, unreactedUnchanged: 0, unreactedTransformed: 0 },
      };
      crystal.origin.unreactedUnchanged += PhaseEquilibriumResponseBuilder.round(u.unreactedPercent);
      crystal.percent = PhaseEquilibriumResponseBuilder.round(crystal.percent + u.unreactedPercent);
      crystal.mass = PhaseEquilibriumResponseBuilder.round((crystal.percent / percentFactor) * totalMass);
      merged.set(u.phaseId, crystal);
    }
    return [...merged.values()].sort((a, b) => b.percent - a.percent);
  }

  private static block(parts: PhaseEquilibriumResponsePart[], totalMass: number): PhaseEquilibriumResponseBlock {
    const percent = parts.reduce((sum, p) => sum + p.percent, 0);
    const composition: Record<string, number> = {};
    for (const part of parts) {
      for (const [key, wt] of Object.entries(part.composition)) {
        composition[key] = (composition[key] ?? 0) + (wt * part.percent) / percent;
      }
    }
    return {
      percent: PhaseEquilibriumResponseBuilder.round(percent),
      mass: PhaseEquilibriumResponseBuilder.round((percent / percentFactor) * totalMass),
      composition: PhaseEquilibriumResponseBuilder.roundComposition(composition),
      parts: parts.map(p => ({
        ...p,
        percent: PhaseEquilibriumResponseBuilder.round(p.percent),
        mass: PhaseEquilibriumResponseBuilder.round(p.mass),
        composition: PhaseEquilibriumResponseBuilder.roundComposition(p.composition),
      })),
    };
  }

  private static roundUnreacted(u: PhaseEquilibriumUnreactedPhase): PhaseEquilibriumUnreactedPhase {
    return {
      ...u,
      originalPercent: PhaseEquilibriumResponseBuilder.round(u.originalPercent),
      originalMass: PhaseEquilibriumResponseBuilder.round(u.originalMass),
      unreactedPercent: PhaseEquilibriumResponseBuilder.round(u.unreactedPercent),
      unreactedMass: PhaseEquilibriumResponseBuilder.round(u.unreactedMass),
      unreactedShare: PhaseEquilibriumResponseBuilder.round(u.unreactedShare),
      ...(u.composition ? { composition: PhaseEquilibriumResponseBuilder.roundComposition(u.composition) } : {}),
    };
  }

  private static roundComposition(composition: Record<string, number>): Record<string, number> {
    return Object.fromEntries(Object.entries(composition).map(([key, wt]) => [key, PhaseEquilibriumResponseBuilder.round(wt)]));
  }

  private static round(value: number): number {
    return Number(value.toFixed(decimals));
  }
}
