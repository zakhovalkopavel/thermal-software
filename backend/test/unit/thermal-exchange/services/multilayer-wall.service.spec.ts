import { RefractoryThermalMaterial } from '../../../../src/modules/refractory/enums/refractory-thermal-material.enum';
import { WallGeometry } from '../../../../src/modules/thermal-exchange/enums/wall-geometry.enum';
import { MultilayerWallService } from '../../../../src/modules/thermal-exchange/services/multilayer-wall.service';

describe('MultilayerWallService', () => {
  let service: MultilayerWallService;
  let mockRadiation: {
    gasRadiationHTC: jest.Mock;
    solidRadiationHTC: jest.Mock;
  };
  let mockDimensionless: {
    nusselt: jest.Mock;
  };
  let mockRefractoryThermal: {
    lambda: jest.Mock;
    emissivity: jest.Mock;
  };
  let mockMetalThermal: {
    lambda: jest.Mock;
    emissivity: jest.Mock;
  };

  beforeEach(() => {
    mockRadiation = {
      gasRadiationHTC: jest.fn().mockReturnValue(50),
      solidRadiationHTC: jest.fn().mockReturnValue(10),
    };
    mockDimensionless = {
      nusselt: jest.fn().mockReturnValue({ h_W_m2K: 100 }),
    };
    mockRefractoryThermal = {
      lambda: jest.fn().mockReturnValue(1.2),
      emissivity: jest.fn().mockReturnValue(0.85),
    };
    mockMetalThermal = {
      lambda: jest.fn().mockReturnValue(20),
      emissivity: jest.fn().mockReturnValue(0.6),
    };

    service = new MultilayerWallService(
      mockRefractoryThermal as any,
      mockMetalThermal as any,
      mockRadiation as any,
      mockDimensionless as any,
    );
  });

  it('calculate - returns converged wall temperatures and inward heat flux for a single refractory layer', () => {
    const dto = {
      geometry: WallGeometry.FLAT,
      a_m: 2, // flat-wall inner area = a · b = 10 m²
      b_m: 5,
      tFlame_K: 1600,
      tAmbient_K: 293,
      w_ms: 5,
      composition: { N2: 0.72, O2: 0.02, CO2: 0.13, CO: 0, H2O: 0.13, H2: 0 },
      mPerSecond_kgs: 1,
      layers: [{ material: RefractoryThermalMaterial.CHAMOTTE_SOLID, thicknessMm: 50 }],
      innerEmissivity: 0.85,
    };

    const result = service.calculate(dto);
    const relativeFluxGap = Math.abs(result.fluxInner_W - result.fluxOuter_W) / result.fluxInner_W;

    expect(result).toHaveProperty('tOuter_K');
    expect(result).toHaveProperty('tInner_K');
    expect(result).toHaveProperty('betweenLayers');
    expect(result).toHaveProperty('alphaInner');
    expect(result).toHaveProperty('fluxInner_W');
    expect(result).toHaveProperty('fluxOuter_W');
    expect(result.tOuter_K).toBeLessThan(dto.tFlame_K);
    expect(result.tInner_K).toBeLessThan(dto.tFlame_K);
    expect(result.fluxInner_W).toBeGreaterThan(0);
    expect(relativeFluxGap).toBeLessThan(0.05); // converged within 5%
    expect(result.betweenLayers).toHaveLength(dto.layers.length - 1);
  });
});
