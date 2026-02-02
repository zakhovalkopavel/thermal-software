import { PSDCalculatorService } from '../../../../src/modules/refractory/services/psd-calculator.service';
import { BadRequestException } from '@nestjs/common';

describe('PSDCalculatorService', () => {
  let service: PSDCalculatorService;

  beforeEach(() => {
    service = new PSDCalculatorService();
  });

  it('andreasenDiscrete - happy path returns mass fractions summing to ~1', () => {
    const fractions = [
      { dMin_mm: 0.1, dMax_mm: 0.5 },
      { dMin_mm: 0.5, dMax_mm: 1.0, isFixed: true, massFraction: 0.2 },
      { dMin_mm: 1.0, dMax_mm: 2.0 },
    ];
    const res = service.andreasenDiscrete(fractions as any, 0.25);
    const sum = res.massFractions.reduce((s: number, v: number) => s + v, 0);
    expect(res.method).toBe('Andreasen');
    expect(sum).toBeGreaterThan(0.999);
    expect(sum).toBeLessThan(1.001);
  });

  it('funkDingerDiscrete - happy path returns method FunkDinger', () => {
    const fractions = [
      { dMin_mm: 0.1, dMax_mm: 0.5 },
      { dMin_mm: 0.5, dMax_mm: 1.0 },
    ];
    const res = service.funkDingerDiscrete(fractions as any, 0.3);
    expect(res.method).toBe('FunkDinger');
    expect(res.massFractions.length).toBe(2);
  });

  it('andreasenDiscrete - throws when all fractions fixed', () => {
    const fractions = [
      { dMin_mm: 0.1, dMax_mm: 0.5, isFixed: true, massFraction: 0.5 },
      { dMin_mm: 0.5, dMax_mm: 1.0, isFixed: true, massFraction: 0.5 },
    ];
    expect(() => service.andreasenDiscrete(fractions as any, 0.25)).toThrow(BadRequestException);
  });

  it('validateInputs - throws on invalid q', () => {
    const fractions = [{ dMin_mm: 0.1, dMax_mm: 1.0 }];
    expect(() => service.andreasenDiscrete(fractions as any, 0)).toThrow(BadRequestException);
    expect(() => service.funkDingerDiscrete(fractions as any, 1.5)).toThrow(BadRequestException);
  });
});
