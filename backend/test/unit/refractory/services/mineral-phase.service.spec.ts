import { MineralPhaseService } from '../../../../src/modules/refractory/services/mineral-phase.service';

describe('MineralPhaseService', () => {
  let service: MineralPhaseService;

  beforeEach(() => {
    service = new MineralPhaseService();
  });

  it('identifyPhases - typical composition returns phases array', () => {
    const comp = { Al2O3: 60, SiO2: 20 } as any;
    const res = service.identifyPhases(comp, 1400);
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
  });

  it('identifyPhases - low oxide returns Mixed solid solution', () => {
    const comp = { C: 100 } as any;
    const res = service.identifyPhases(comp, 1400);
    expect(res[0].phase).toContain('Mixed');
  });
});
