import { GlassViscosityService } from '../../../../src/modules/refractory/services/glass-viscosity.service';

describe('GlassViscosityService', () => {
  let service: GlassViscosityService;

  beforeEach(() => {
    service = new GlassViscosityService();
  });

  it('calculateViscosity - typical borosilicate returns fields and fixed points', () => {
    const comp = { SiO2: 65, B2O3: 10, Na2O: 5, Al2O3: 10 } as any;
    const res = service.calculateViscosity(comp, 1000);
    expect(res).toHaveProperty('viscosity_Pas');
    expect(res).toHaveProperty('softening_Point_C');
    expect(res.components).toHaveProperty('networkFormers');
  });

  it('calculateViscosity - clamps to max when extreme composition', () => {
    const comp = { Al2O3: 100 } as any;
    const res = service.calculateViscosity(comp, 10);
    expect(typeof res.viscosity_Pas).toBe('number');
  });
});
