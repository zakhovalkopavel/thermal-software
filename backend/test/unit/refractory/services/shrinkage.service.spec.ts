import { ShrinkageService } from '../../../../src/modules/refractory/services/shrinkage.service';
import { BadRequestException } from '@nestjs/common';

describe('ShrinkageService', () => {
  let service: ShrinkageService;

  beforeEach(() => {
    service = new ShrinkageService();
  });

  it('calculateCompleteShrinkage - happy path returns structured result', () => {
    const data = {
      materials: [{ activationEnergy_Jmol: 500000 }, { activationEnergy_Jmol: 400000 }],
      massFractions: [0.6, 0.4],
      temperatureProfile_C: [800, 1200],
      waterCementRatio: 0.35,
      cementContent: 0.15,
    } as any;
    const res = service.calculateCompleteShrinkage(data);
    expect(res).toHaveProperty('drying');
    expect(res).toHaveProperty('firing');
    expect(Array.isArray(res.firing)).toBe(true);
  });

  it('calculateCompleteShrinkage - throws on mismatched arrays', () => {
    const data = {
      materials: [{}, {}],
      massFractions: [1],
      temperatureProfile_C: [800],
    } as any;
    expect(() => service.calculateCompleteShrinkage(data)).toThrow(BadRequestException);
  });

  it('calculateCompleteShrinkage - throws on mass fractions sum mismatch', () => {
    const data = {
      materials: [{}, {}],
      massFractions: [0.2, 0.3],
      temperatureProfile_C: [800],
    } as any;
    expect(() => service.calculateCompleteShrinkage(data)).toThrow(BadRequestException);
  });
});
