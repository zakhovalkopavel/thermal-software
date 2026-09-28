import { CombustionService } from '../../../../src/modules/combustion/services/combustion.service';
import { GasPropertiesService } from '../../../../src/modules/thermodynamics/services/gas-properties.service';

describe('CombustionService', () => {
  let service: CombustionService;
  let mockGasProps: GasPropertiesService;

  beforeEach(() => {
    mockGasProps = {
      cpMixture: jest.fn().mockReturnValue(30),
      molecularWeight: jest.fn().mockReturnValue(0.029),
    } as unknown as GasPropertiesService;

    service = new CombustionService(mockGasProps);
  });

  it('calculate - returns combustion state and valid products for representative preheated-air input', () => {
    const dto = {
      fPower_W: 1_000_000,
      fuelQ_Jkg: 35_000_000,
      kExcessAir: 1.1,
      tAirStart_K: 573,
      pO2: 0.21,
      wH2Om: 0.01,
      generatorHeatLoss_W: 0,
    };

    const result = service.calculate(dto);

    expect(result).toHaveProperty('tFlame_K');
    expect(result).toHaveProperty('tSmokeStart_K');
    expect(result).toHaveProperty('mFuel_kgs');
    expect(result).toHaveProperty('mAir_kgs');
    expect(result).toHaveProperty('mSmoke_kgs');
    expect(result).toHaveProperty('composition');
    expect(result.tFlame_K).toBeGreaterThan(result.tSmokeStart_K);
    expect(result.tFlame_K).toBeGreaterThan(dto.tAirStart_K);
    expect(result.composition.after.N2).toBeGreaterThan(0);
    expect(result.composition.after.CO2).toBeGreaterThan(0);
    expect(result.composition.after.O2).toBeGreaterThan(0);
    expect(result.pCO2 + result.pH2O).toBeLessThan(1);
  });

  it('calculate - conserves mass for a stoichiometric pure-oxygen reference case', () => {
    const dto = {
      fPower_W: 1_000_000,
      fuelQ_Jkg: 35_000_000,
      carbonQ_Jkg: 35_000_000, // pure-carbon reference: fuel mass equals reacting carbon mass
      kExcessAir: 1,
      tAirStart_K: 573,
      pO2: 1,
      wH2Om: 0,
      generatorHeatLoss_W: 0,
    };

    const result = service.calculate(dto);
    const relativeMassError = Math.abs(result.mSmoke_kgs - (result.mFuel_kgs + result.mAir_kgs)) / result.mSmoke_kgs;

    expect(relativeMassError).toBeLessThan(0.001); // within 0.1%
  });
});
