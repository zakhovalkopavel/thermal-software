import { BadRequestException, Injectable } from '@nestjs/common';
import type { PhaseEquilibriumLegacyResult } from '../../types/phase-equilibrium-legacy-result.type';

/**
 * Legacy phase-diagram variant (digitized liquid-fraction diagrams).
 * Stub: no diagram dataset is validated yet, so every call is rejected.
 * The orchestrator lets `legacy` + `diagram` fail with this error and skips the
 * legacy side in `compare` mode. See docs/algorithms/phase-equilibrium/LEGACY_DIAGRAM_PHASE_EQUILIBRIUM.md.
 */
@Injectable()
export class PhaseEquilibriumLegacyDiagramService {
  calculate(_composition: Record<string, number>, _temperature: number, _totalMass?: number): PhaseEquilibriumLegacyResult {
    throw new BadRequestException('legacyDiagram is not available until phase-diagram datasets are validated');
  }
}
