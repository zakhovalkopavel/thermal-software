import { ParticipationService } from '../../../../../src/modules/refractory/services/particle-packing/participation.service';

describe('ParticipationService', () => {
  let service: ParticipationService;

  beforeEach(() => {
    service = new ParticipationService();
  });

  describe('calculateParticipation — happy path', () => {
    it('returns factors for each fraction and normalized participation summing to ~1', () => {
      const fractions = [
        { dMin_mm: 0.01, dMax_mm: 0.05, massFraction: 0.2 },
        { dMin_mm: 0.05, dMax_mm: 0.2, massFraction: 0.3 },
        { dMin_mm: 0.2, dMax_mm: 1.5, massFraction: 0.5 },
      ];
      const res = service.calculateParticipation(fractions);
      expect(res.participationFactors).toHaveLength(3);
      expect(res.normalizedParticipation).toHaveLength(3);
      const sumNorm = res.normalizedParticipation.reduce(
        (s, p) => s + p.normalizedParticipation,
        0,
      );
      expect(sumNorm).toBeGreaterThan(0.999);
      expect(sumNorm).toBeLessThanOrEqual(1.001);
      expect(res.totalParticipation).toBeGreaterThan(0);
    });

    it('sets dMean as the midpoint of dMin and dMax', () => {
      const res = service.calculateParticipation([
        { dMin_mm: 1, dMax_mm: 3, massFraction: 1 },
      ]);
      expect(res.participationFactors[0].dMean_mm).toBeCloseTo(2, 3);
    });

    it('computes participationFactor as 1/√(dMean)', () => {
      const dMean = 0.25;
      const res = service.calculateParticipation([
        { dMin_mm: dMean, dMax_mm: dMean, massFraction: 1 },
      ]);
      expect(res.participationFactors[0].participationFactor).toBeCloseTo(
        1 / Math.sqrt(dMean),
        4,
      );
      expect(res.participationFactors[0].effectiveParticipation).toBeCloseTo(
        1 / Math.sqrt(dMean),
        4,
      );
    });
  });

  describe('size sensitivity', () => {
    it('gives finer particles a higher participation factor than coarse ones', () => {
      const res = service.calculateParticipation([
        { dMin_mm: 0.01, dMax_mm: 0.01, massFraction: 0.5 },
        { dMin_mm: 2, dMax_mm: 2, massFraction: 0.5 },
      ]);
      const fine = res.participationFactors[0];
      const coarse = res.participationFactors[1];
      expect(fine.participationFactor).toBeGreaterThan(coarse.participationFactor);
      expect(res.normalizedParticipation[0].normalizedParticipation).toBeGreaterThan(
        res.normalizedParticipation[1].normalizedParticipation,
      );
    });

    it('scales effective participation with mass fraction at equal sizes', () => {
      const res = service.calculateParticipation([
        { dMin_mm: 0.1, dMax_mm: 0.1, massFraction: 0.25 },
        { dMin_mm: 0.1, dMax_mm: 0.1, massFraction: 0.75 },
      ]);
      expect(res.participationFactors[1].effectiveParticipation).toBeCloseTo(
        res.participationFactors[0].effectiveParticipation * 3,
        3,
      );
    });
  });

  describe('edge cases', () => {
    it('handles tiny dMean values without throwing', () => {
      const res = service.calculateParticipation([
        { dMin_mm: 1e-9, dMax_mm: 1e-9, massFraction: 1 },
      ]);
      expect(res.totalParticipation).toBeGreaterThan(0);
      expect(res.normalizedParticipation[0].normalizedParticipation).toBeCloseTo(1, 4);
    });

    it('handles a single fraction', () => {
      const res = service.calculateParticipation([
        { dMin_mm: 0.5, dMax_mm: 1.5, massFraction: 1 },
      ]);
      expect(res.participationFactors).toHaveLength(1);
      expect(res.normalizedParticipation[0].normalizedParticipation).toBe(1);
      expect(res.participationFactors[0].fractionIndex).toBe(0);
    });

    it('preserves fractionIndex order', () => {
      const res = service.calculateParticipation([
        { dMin_mm: 1, dMax_mm: 2, massFraction: 0.4 },
        { dMin_mm: 0.1, dMax_mm: 0.2, massFraction: 0.6 },
      ]);
      expect(res.participationFactors.map((p) => p.fractionIndex)).toEqual([0, 1]);
    });
  });
});
