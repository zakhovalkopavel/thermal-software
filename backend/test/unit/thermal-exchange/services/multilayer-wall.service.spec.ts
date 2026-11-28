import { RefractoryThermalMaterial } from '../../../../src/modules/refractory/enums/refractory-thermal-material.enum';
import { MetalMaterial } from '../../../../src/modules/metals/enums/metal-material.enum';
import { WallGeometry } from '../../../../src/modules/thermal-exchange/enums/wall-geometry.enum';
import { MultilayerWallService } from '../../../../src/modules/thermal-exchange/services/multilayer-wall.service';
import { celsiusToKelvin } from '../../../../src/common/thermal/utils/temperature';

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
    expect(result).toHaveProperty('temperatureProfile');
    expect(result).toHaveProperty('alphaInner');
    expect(result).toHaveProperty('fluxInner_W');
    expect(result).toHaveProperty('fluxOuter_W');
    expect(result.tOuter_K).toBeLessThan(dto.tFlame_K);
    expect(result.tInner_K).toBeLessThan(dto.tFlame_K);
    expect(result.fluxInner_W).toBeGreaterThan(0);
    expect(relativeFluxGap).toBeLessThan(1e-3);
    expect(result.betweenLayers).toHaveLength(dto.layers.length - 1);
    expect(result.temperatureProfile).toHaveLength(51); // default numberOfSteps + inner surface
    expect(result.temperatureProfile[0]).toEqual({ x_mm: 0, tCelsius: expect.any(Number) });
    expect(result.temperatureProfile.at(-1)?.x_mm).toBeCloseTo(dto.layers[0].thicknessMm, 6);
    // previous bisection (stop at 0.1 % flux error) gave 1448.28 K
    expect(Math.abs(result.tInner_K - 1448.28)).toBeLessThan(1);
  });

  it('calculate - two layers: temperatures fall monotonically from flame to ambient and fluxes balance', () => {
    const dto = {
      geometry: WallGeometry.CYLINDER,
      a_m: 1,
      b_m: 3,
      tFlame_K: 1600,
      tAmbient_K: 293,
      w_ms: 5,
      composition: { N2: 0.72, O2: 0.02, CO2: 0.13, CO: 0, H2O: 0.13, H2: 0 },
      mPerSecond_kgs: 1,
      layers: [
        { material: RefractoryThermalMaterial.CHAMOTTE_SOLID, thicknessMm: 50 },
        { material: MetalMaterial.MILD_STEEL, thicknessMm: 5 },
      ],
      innerEmissivity: 0.85,
    };

    const result = service.calculate(dto);
    const relativeFluxGap = Math.abs(result.fluxInner_W - result.fluxOuter_W) / result.fluxInner_W;
    const tBetween_K = celsiusToKelvin(result.betweenLayers[0].tCelsius);

    expect(result.betweenLayers).toHaveLength(1);
    expect(result.tInner_K).toBeLessThan(dto.tFlame_K);
    expect(tBetween_K).toBeLessThan(result.tInner_K);
    expect(result.tOuter_K).toBeLessThan(tBetween_K);
    expect(result.tOuter_K).toBeGreaterThan(dto.tAmbient_K);
    expect(relativeFluxGap).toBeLessThan(1e-3);
    expect(result.temperatureProfile.length).toBeGreaterThan(2);
    for (let i = 1; i < result.temperatureProfile.length; i++) {
      expect(result.temperatureProfile[i].tCelsius).toBeLessThan(result.temperatureProfile[i - 1].tCelsius);
      expect(result.temperatureProfile[i].x_mm).toBeGreaterThan(result.temperatureProfile[i - 1].x_mm);
    }
  });

  it('calculate - λ(T) makes the through-wall profile non-linear on a flat wall', () => {
    mockRefractoryThermal.lambda.mockImplementation((_mat: string, T_K: number) => 0.5 + T_K / 1000);

    const dto = {
      geometry: WallGeometry.FLAT,
      a_m: 2,
      b_m: 5,
      tFlame_K: 1600,
      tAmbient_K: 293,
      w_ms: 5,
      composition: { N2: 0.72, O2: 0.02, CO2: 0.13, CO: 0, H2O: 0.13, H2: 0 },
      mPerSecond_kgs: 1,
      layers: [{ material: RefractoryThermalMaterial.CHAMOTTE_SOLID, thicknessMm: 100 }],
      innerEmissivity: 0.85,
      numberOfSteps: 20,
    };

    const result = service.calculate(dto);
    const mid = result.temperatureProfile[Math.floor(result.temperatureProfile.length / 2)];
    const first = result.temperatureProfile[0];
    const last = result.temperatureProfile.at(-1)!;
    const linearMidT =
      first.tCelsius + (last.tCelsius - first.tCelsius) * ((mid.x_mm - first.x_mm) / (last.x_mm - first.x_mm));

    expect(result.temperatureProfile).toHaveLength(21);
    expect(mockRefractoryThermal.lambda.mock.calls.length).toBeGreaterThan(dto.numberOfSteps);
    // Higher λ at higher T → shallower gradient near the hot face → mid T above the chord
    expect(mid.tCelsius).toBeGreaterThan(linearMidT + 1);
  });
});
