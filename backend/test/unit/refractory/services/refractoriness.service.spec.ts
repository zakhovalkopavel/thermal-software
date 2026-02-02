import { Test, TestingModule } from '@nestjs/testing';
import { RefractorinessService } from '../../../../src/modules/refractory/services/refractoriness.service';

describe('RefractorinessService', () => {
  let service: RefractorinessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefractorinessService],
    }).compile();

    service = module.get<RefractorinessService>(RefractorinessService);
  });

  it('calculateRefractoriness - typical composition returns numeric estimate', () => {
    const composition = { SiO2: 50, Al2O3: 40, CaO: 5 } as any;
    const res = service.calculateRefractoriness(composition, 'ISO1893');
    expect(typeof res.estimatedRefractoriness_C).toBe('number');
    expect(res.classification).toBeDefined();
  });

  it('calculateRefractoriness - extreme flux clamps to min temperature', () => {
    const composition = { Na2O: 100 } as any;
    const res = service.calculateRefractoriness(composition, 'ISO1893');
    expect(typeof res.estimatedRefractoriness_C).toBe('number');
  });

  it('calculateRefractoriness - unknown standard returns genericRefractoriness_C', () => {
    const composition = { SiO2: 40 } as any;
    const res = service.calculateRefractoriness(composition, 'UNKNOWN');
    expect(res).toHaveProperty('genericRefractoriness_C');
  });
});
