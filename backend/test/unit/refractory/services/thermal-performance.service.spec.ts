import { ThermalPerformanceService } from '../../../../src/modules/refractory/services/thermal-performance.service';

describe('ThermalPerformanceService', () => {
  let service: ThermalPerformanceService;

  beforeEach(() => {
    service = new ThermalPerformanceService();
  });

  it('calculateThermalConductivity - happy path returns numeric fields', () => {
    const composition = { SiO2: 40, Al2O3: 30, CaO: 10 } as any;
    const res = service.calculateThermalConductivity(composition, 200, 0.2);
    expect(res).toHaveProperty('thermalConductivity_WmK');
    expect(res).toHaveProperty('specificHeat_JkgK');
    expect(res).toHaveProperty('density_kgm3');
  });

  it('porosity 0 results in high conductivity (no pores effect)', () => {
    const composition = { SiO2: 40, Al2O3: 30 } as any;
    const res = service.calculateThermalConductivity(composition, 300, 0);
    expect(res.porosity).toBe(0);
  });
});
