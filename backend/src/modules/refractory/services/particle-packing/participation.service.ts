import { Injectable } from '@nestjs/common';

/**
 * Participation Calculator Service
 * Ported from: legacy/refractory/src/calculators/ParticipationCalculator.ts (99 lines)
 *
 * Calculates how much of each particle size participates in chemical reactions
 * during firing. Smaller particles have higher surface area and react more readily.
 *
 * Key Concepts:
 * - Participation factor: Fraction of particles that undergo reaction at given temperature
 * - Fine particles (< 100 μm): High participation, react at lower temperatures
 * - Medium particles (100-1000 μm): Moderate participation
 * - Coarse particles (> 1 mm): Low participation, require higher temperatures
 *
 * Model:
 * - Participation factor ∝ 1/√(particle_diameter)
 * - Surface area dependency (larger surface → more reaction)
 * - Temperature dependency (higher T → more participation)
 */
@Injectable()
export class ParticipationService {
  calculateParticipation(fractions: Array<{ dMin_mm: number; dMax_mm: number; massFraction: number }>) {
    // Calculate participation factors for each fraction
    const participationFactors = fractions.map((fraction, index) => {
      const dMean = (fraction.dMin_mm + fraction.dMax_mm) / 2;

      // Participation factor increases with smaller particles
      const participationFactor = 1 / Math.sqrt(dMean);

      // Effective participation considering mass fraction
      const effectiveParticipation = participationFactor * fraction.massFraction;

      return {
        fractionIndex: index,
        dMin_mm: fraction.dMin_mm,
        dMax_mm: fraction.dMax_mm,
        dMean_mm: Number(dMean.toFixed(3)),
        massFraction: fraction.massFraction,
        participationFactor: Number(participationFactor.toFixed(4)),
        effectiveParticipation: Number(effectiveParticipation.toFixed(4)),
      };
    });

    const totalParticipation = participationFactors.reduce((sum, pf) => sum + pf.effectiveParticipation, 0);

    return {
      participationFactors,
      totalParticipation: Number(totalParticipation.toFixed(4)),
      normalizedParticipation: participationFactors.map(pf => ({
        ...pf,
        normalizedParticipation: Number((pf.effectiveParticipation / totalParticipation).toFixed(4)),
      })),
    };
  }
}

