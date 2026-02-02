import { ParticipationService } from '../../../../src/modules/refractory/services/participation.service';

describe('ParticipationService', () => {
  let service: ParticipationService;

  beforeEach(() => {
    service = new ParticipationService();
  });

  it('calculateParticipation - returns normalized participation summing to ~1', () => {
    const fractions = [
      { dMin_mm: 0.01, dMax_mm: 0.05, massFraction: 0.2 },
      { dMin_mm: 0.05, dMax_mm: 0.2, massFraction: 0.3 },
      { dMin_mm: 0.2, dMax_mm: 1.5, massFraction: 0.5 },
    ];
    const res = service.calculateParticipation(fractions as any);
    expect(res.participationFactors.length).toBe(3);
    const sumNorm = res.normalizedParticipation.reduce((s: number, p: any) => s + p.normalizedParticipation, 0);
    expect(sumNorm).toBeGreaterThan(0.999);
  });

  it('calculateParticipation - handles tiny dMean values without throwing', () => {
    const fractions = [{ dMin_mm: 1e-9, dMax_mm: 1e-9, massFraction: 1 }];
    const res = service.calculateParticipation(fractions as any);
    expect(res.totalParticipation).toBeDefined();
  });
});
