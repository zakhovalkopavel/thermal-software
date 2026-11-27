import { BadRequestException, Injectable } from '@nestjs/common';
import { PHASE_EQUILIBRIUM_CONSTANTS } from '../../constants/phase-equilibrium.constants';
import { PhaseEquilibriumInputDto } from '../../dto/phase-equilibrium/phase-equilibrium-input.dto';
import { AlgorithmMode } from '../../enums/algorithm-mode.enum';
import { LegacyVariant } from '../../enums/legacy-variant.enum';
import type { PhaseEquilibriumEngineInput } from '../../types/phase-equilibrium-engine-input.type';
import type { PhaseEquilibriumEngineResult } from '../../types/phase-equilibrium-engine-result.type';
import type { PhaseEquilibriumEngineRun } from '../../types/phase-equilibrium-engine-run.type';
import type { PhaseEquilibriumFractionState } from '../../types/phase-equilibrium-fraction-state.type';
import type { PhaseEquilibriumResponse } from '../../types/phase-equilibrium-response.type';
import type { MeltPropertyBundle } from '../../types/melt-property-bundle.type';
import { EngineComparison } from '../../utils/engine-comparison';
import { GrainReaction } from '../../utils/grain-reaction';
import { toFiredPhases } from '../../utils/fired-phases.util';
import { LegacyEngineAdapter } from '../../utils/legacy-engine-adapter';
import { MatrixComposition } from '../../utils/matrix-composition';
import { MeltPropertyBundleAdapter } from '../../utils/melt-property-bundle';
import { PhaseEquilibriumResponseBuilder } from '../../utils/phase-equilibrium-response-builder';
import { UnreactedGlassViscosity } from '../../utils/unreacted-glass-viscosity';
import { UnreactedPhases } from '../../utils/unreacted-phases';
import { MixComponentCatalogService } from '../catalog/mix-component-catalog.service';
import { GlassViscosityService } from './glass-viscosity.service';
import { PhaseEquilibriumCalphadService } from './phase-equilibrium-calphad.service';
import { PhaseEquilibriumLegacyDiagramService } from './phase-equilibrium-legacy-diagram.service';
import { PhaseEquilibriumLegacyEutecticService } from './phase-equilibrium-legacy-eutectic.service';

/**
 * Phase equilibrium of a mix of library raw materials fired at T for a hold time.
 *
 * Shared steps: fired composition per material (loss on ignition removed) → grain-reaction
 * model (δ, X) → matrix = reacted shells → engine(s) on the matrix → response with the
 * unreacted grain cores. Engines: CALPHAD estimate, legacy eutectic / diagram, or both (compare).
 * Algorithm: docs/algorithms/phase-equilibrium/FULL_PHASE_EQUILIBRIUM.md
 */
@Injectable()
export class PhaseEquilibriumService {
  constructor(
    private readonly mixComponentCatalog: MixComponentCatalogService,
    private readonly calphad: PhaseEquilibriumCalphadService,
    private readonly legacyEutectic: PhaseEquilibriumLegacyEutecticService,
    private readonly legacyDiagram: PhaseEquilibriumLegacyDiagramService,
    private readonly glassViscosity: GlassViscosityService,
  ) {}

  calculate(dto: PhaseEquilibriumInputDto): PhaseEquilibriumResponse {
    const totalMass = dto.totalMass ?? PHASE_EQUILIBRIUM_CONSTANTS.defaultTotalMass;
    const holdTime_hours = dto.holdTime_hours ?? PHASE_EQUILIBRIUM_CONSTANTS.defaultHoldTime_hours;
    const mode = dto.algorithmMode ?? AlgorithmMode.CALPHAD;
    const states = this.resolveFractions(dto, holdTime_hours);
    const matrix = MatrixComposition.build(states);
    if (matrix.percent <= 0) {
      throw new BadRequestException('The mix has no reactive oxide matrix (only inert or non-oxide phases)');
    }
    const engineInput: PhaseEquilibriumEngineInput = {
      composition: matrix.composition,
      temperature_C: dto.temperature,
      totalMass: (matrix.percent / 100) * totalMass,
    };
    const run = this.runEngines(mode, dto.legacyVariant ?? LegacyVariant.EUTECTIC, engineInput);
    const liquidProps = this.liquidProperties(run, dto.temperature);
    const unreactedGlass = UnreactedGlassViscosity.attach(
      UnreactedPhases.build(states, totalMass),
      composition => this.evaluateMeltProperties(composition, dto.temperature),
    );
    return PhaseEquilibriumResponseBuilder.build({
      mode,
      engine: run.primary,
      matrix,
      unreacted: unreactedGlass.phases,
      states,
      temperature: dto.temperature,
      holdTime_hours,
      totalMass,
      viscosity: liquidProps.bundle.viscosity,
      liquidGlassPoints: liquidProps.bundle.glassPoints,
      comparison: run.comparison,
      warnings: [...run.warnings, ...liquidProps.warnings, ...unreactedGlass.warnings],
    });
  }

  /** Material lookup, fired mass fractions (loss on ignition removed), δ and X per size fraction. */
  private resolveFractions(dto: PhaseEquilibriumInputDto, holdTime_hours: number): PhaseEquilibriumFractionState[] {
    const totalFraction = dto.fractions.reduce((sum, f) => sum + f.massFraction, 0);
    if (totalFraction <= 0) throw new BadRequestException('Sum of massFraction must be greater than 0');
    const rows = dto.fractions.map(f => {
      const material = this.mixComponentCatalog.getMixComponent(f.materialId);
      const massFraction = f.massFraction / totalFraction;
      const fired = toFiredPhases(material.composition);
      return { f, material, massFraction, fired, firedMass: massFraction * (100 - fired.lossOnIgnition_wt) };
    });
    const firedTotal = rows.reduce((sum, r) => sum + r.firedMass, 0);
    if (firedTotal <= 0) throw new BadRequestException('The mix has no fired mass');
    return rows.map(r => {
      const penetrationDepth_mm = GrainReaction.penetrationDepth_mm(r.material.activationEnergy_Jmol, dto.temperature, holdTime_hours);
      return {
        material: r.material,
        d50_mm: r.f.d50_mm,
        massFraction: r.massFraction,
        firedFraction: r.firedMass / firedTotal,
        penetrationDepth_mm,
        reactedFraction: GrainReaction.reactedFraction(r.f.d50_mm, penetrationDepth_mm),
        firedPhases_wt: r.fired.phases_wt,
      };
    });
  }

  private runEngines(mode: AlgorithmMode, variant: LegacyVariant, input: PhaseEquilibriumEngineInput): PhaseEquilibriumEngineRun {
    if (mode === AlgorithmMode.CALPHAD) return { primary: this.calphad.equilibrateMatrix(input), warnings: [] };
    if (mode === AlgorithmMode.LEGACY) return { primary: this.runLegacy(variant, input), warnings: [] };
    const primary = this.calphad.equilibrateMatrix(input);
    try {
      const legacy = this.runLegacy(variant, input);
      return { primary, comparison: EngineComparison.build(primary, legacy, variant), warnings: [] };
    } catch (error) {
      if (!(error instanceof BadRequestException)) throw error;
      return {
        primary,
        comparison: EngineComparison.build(primary, null, variant, error.message),
        warnings: [`Legacy ${variant} skipped in compare mode: ${error.message}`],
      };
    }
  }

  private runLegacy(variant: LegacyVariant, input: PhaseEquilibriumEngineInput): PhaseEquilibriumEngineResult {
    const engine = variant === LegacyVariant.DIAGRAM ? this.legacyDiagram : this.legacyEutectic;
    return LegacyEngineAdapter.toEngineResult(engine.calculate(input.composition, input.temperature_C, input.totalMass));
  }

  /** Melt properties of the matrix liquid; unavailable models only add a warning. */
  private liquidProperties(
    run: PhaseEquilibriumEngineRun,
    temperature: number,
  ): { bundle: MeltPropertyBundle; warnings: string[] } {
    const empty: MeltPropertyBundle = { viscosity: null, glassPoints: null };
    if (run.primary.liquidPercent <= 0) return { bundle: empty, warnings: [] };
    try {
      return { bundle: this.evaluateMeltProperties(run.primary.liquidComposition, temperature), warnings: [] };
    } catch (error) {
      return {
        bundle: empty,
        warnings: [`Matrix liquid viscosity not available: ${(error as Error).message}`],
      };
    }
  }

  private evaluateMeltProperties(composition: Record<string, number>, temperature: number): MeltPropertyBundle {
    return MeltPropertyBundleAdapter.adapt(this.glassViscosity.calculateViscosity(composition, temperature));
  }
}
