import { PhaseEquilibriumService } from '../../../../src/modules/refractory/services/phase-equilibrium.service';
import { BadRequestException } from '@nestjs/common';

describe('PhaseEquilibriumService', () => {
  let service: PhaseEquilibriumService;

  beforeEach(() => {
    service = new PhaseEquilibriumService();
  });

  it('calculatePhaseEquilibrium - happy path returns liquid and solid', () => {
    const data = { composition: { SiO2: 34, Al2O3: 36, CaO: 30 }, temperature: 1400 } as any;
    const res = service.calculatePhaseEquilibrium(data);
    expect(res).toHaveProperty('liquid');
    expect(res).toHaveProperty('solid');
    expect(res.metadata).toHaveProperty('temperature');
  });

  it('validateComposition - throws when composition sum outside range', () => {
    const data = { composition: { SiO2: 10 }, temperature: 1400 } as any;
    expect(() => service.calculatePhaseEquilibrium(data)).toThrow(BadRequestException);
  });
});
