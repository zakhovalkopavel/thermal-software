import { RecuperatorHtcService } from '../../../../src/modules/thermal-exchange/services/recuperator-htc.service';

describe('RecuperatorHtcService', () => {
  let service: RecuperatorHtcService;
  let mockRadiation: {
    gasRadiationHTC: jest.Mock;
    solidRadiationHTC: jest.Mock;
  };
  let mockDimensionless: {
    nusselt: jest.Mock;
  };

  const baseDto = {
    tSmoke_K: 1200,
    wSmoke_ms: 3,
    smokeComposition: { N2: 0.72, O2: 0.02, CO2: 0.13, CO: 0, H2O: 0.13, H2: 0 },
    dSmoke_m: 0.04,
    lSmoke_m: 0.126,
    rayLengthSmoke_m: 0.036,
    smokeEmissivity: 0.85,
    tAir_K: 400,
    wAir_ms: 5,
    dAir_m: 0.04,
    lAir_m: 0.16,
    rayLengthAir_m: 0.036,
    airEmissivity: 0.6,
    wallThickness_m: 0.003,
    wallLambda_WmK: 20,
    length_m: 1,
  };

  beforeEach(() => {
    mockRadiation = {
      gasRadiationHTC: jest.fn().mockReturnValue(30),
      solidRadiationHTC: jest.fn().mockReturnValue(5),
    };
    mockDimensionless = {
      nusselt: jest.fn().mockReturnValue({ h_W_m2K: 80 }),
    };

    service = new RecuperatorHtcService(
      mockRadiation as any,
      mockDimensionless as any,
      {} as any,
    );
  });

  it('calculate - returns positive overall HTC below both side HTCs', () => {
    const result = service.calculate(baseDto);

    expect(result).toHaveProperty('alphaSmoke');
    expect(result).toHaveProperty('alphaAir');
    expect(result).toHaveProperty('alphaOverall_Wm2K');
    expect(result.alphaOverall_Wm2K).toBeGreaterThan(0);
    expect(result.alphaOverall_Wm2K).toBeLessThan(result.alphaSmoke.total_Wm2K);
    expect(result.alphaOverall_Wm2K).toBeLessThan(result.alphaAir.total_Wm2K);
  });

  it('calculate with pure air composition - does not call gasRadiationHTC on the air side', () => {
    const result = service.calculate({
      ...baseDto,
      airComposition: { N2: 0.79, O2: 0.21, CO2: 0, CO: 0, H2O: 0, H2: 0 },
    });

    expect(mockRadiation.gasRadiationHTC).toHaveBeenCalledTimes(1); // smoke side only
    expect(result.alphaAir.radiation_Wm2K).toBeCloseTo(0, 10);
  });

  it('calculate with participating air-side gases - calls gasRadiationHTC on the air side', () => {
    const result = service.calculate({
      ...baseDto,
      airComposition: { N2: 0.68, O2: 0.19, CO2: 0.05, CO: 0, H2O: 0.08, H2: 0 },
    });

    expect(mockRadiation.gasRadiationHTC).toHaveBeenCalledTimes(2); // smoke side + air side
    expect(result.alphaAir.radiation_Wm2K).toBeGreaterThan(0);
  });
});
