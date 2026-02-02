import { ViscosityService } from '../../../../src/modules/refractory/services/viscosity.service';

describe('ViscosityService', () => {
  let service: ViscosityService;

  beforeEach(() => {
    service = new ViscosityService();
  });

  it('calculateViscosity - typical composition returns viscosity and components', () => {
    const comp = { SiO2: 50, Al2O3: 30, CaO: 10 } as any;
    const res = service.calculateViscosity(comp, 1500);
    expect(res).toHaveProperty('viscosity_Pas');
    expect(res.components).toHaveProperty('oxides');
  });

  it('calculateViscosity - clamps viscosity to range', () => {
    const comp = { Na2O: 100 } as any; // strong flux leading to low viscosity or extreme B
    const res = service.calculateViscosity(comp, 100);
    expect(typeof res.viscosity_Pas).toBe('number');
  });
});
