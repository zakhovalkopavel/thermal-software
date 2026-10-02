import { Test } from '@nestjs/testing';
import { RecuperatorModule } from '../../../../src/modules/recuperator/recuperator.module';
import { RecuperatorService } from '../../../../src/modules/recuperator/services/recuperator.service';
import { CombustionService } from '../../../../src/modules/combustion/services/combustion.service';
import { RecuperatorInputDto } from '../../../../src/modules/recuperator/dto/recuperator-input.dto';
import { HoleForm } from '../../../../src/modules/recuperator/enums/hole-form.enum';
import { RECUPERATOR } from '../../../../src/modules/recuperator/constants/recuperator.constants';
import { CombustionMode } from '../../../../src/modules/combustion/enums/combustion-mode.enum';
import { CombustionModeInputDto } from '../../../../src/modules/combustion/dto/combustion-mode';
import { FuelPhase } from '../../../../src/modules/combustion/enums/fuel-phase.enum';
import { FuelId } from '../../../../src/modules/combustion/enums/fuel-id.enum';
import { COMBUSTION_EXAMPLES } from '../../../../src/modules/combustion/constants';

describe('RecuperatorService — smoke from the selected combustion mode', () => {
  let service: RecuperatorService;
  let combustion: CombustionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [RecuperatorModule] }).compile();
    service = moduleRef.get(RecuperatorService);
    combustion = moduleRef.get(CombustionService);
  });

  const geometry: Omit<RecuperatorInputDto, 'combustion' | 'tAirStart_K'> = {
    holeForm: HoleForm.CIRCLE, d0_m: 0.04, refractoryThickness_m: 0.003, nAir: 100, nSmoke: 81,
    wantedRecuperatorLength_m: 1.5, thermalInsulationThickness_m: 0.05, refractoryLambda_WmK: 1.2,
    refractoryEmissivity: 0.85, surfaceEmissivity: 0.9, surfaceArea_m2: 5,
  };

  const naturalGas: CombustionModeInputDto = {
    mode: CombustionMode.Fluid,
    fluid: { phase: FuelPhase.Gas, fuelGas: { CH4: 0.95, CO2: 0.01, N2: 0.04 }, fPower_W: 5_000, kExcessAir: 1.2, tAir_K: 573 },
  };

  it('uses flame temperature and flows of the combustion mode', () => {
    const r = service.calculate({ ...geometry, combustion: naturalGas, tAirStart_K: 573 });
    const flue = combustion.flueGas(naturalGas);
    expect(r.tFlame_K).toBe(flue.tFlame_K);
    expect(r.maxFlameTemp_K).toBe(flue.tFlame_K);
    expect(r.tSmokeStart_K).toBe(Math.min(flue.tFlame_K / RECUPERATOR.FLAME_TO_SMOKE_RATIO, RECUPERATOR.T_SMOKE_START_MAX_K));
    expect(r.mFuel_kgh).toBeCloseTo(flue.mFuel_kgs * 3600, 12);
    expect(r.tAirEnd_K).toBeGreaterThan(573);
    expect(r.tSmokeEnd_K).toBeLessThan(r.tSmokeStart_K);
    expect(r.airEnergyIncrease_W).toBeGreaterThan(0);
    expect(Number.isFinite(r.recuperatorLength_m)).toBe(true);
  });

  it('air preheat offset raises the maximum flame temperature', () => {
    const r = service.calculate({ ...geometry, combustion: naturalGas, tAirStart_K: 573, airPreheat_K: 300 });
    expect(r.maxFlameTemp_K).toBeGreaterThan(r.tFlame_K);
  });

  it.each([
    ['solid-direct', { mode: CombustionMode.SolidDirect, solidDirect: { fuelId: FuelId.CharcoalBriquette, fPower_W: 5_000, kExcessAir: 1.4, tAir_K: 293 } }],
    ['solid-two-step', { mode: CombustionMode.SolidTwoStep, solidTwoStep: { fuelId: FuelId.CharcoalOak, fPower_W: 5_000, kExcessAir: 1.3, tAirPrimary_K: 673, tAirSecondary_K: 293 } }],
    ['bed', { mode: CombustionMode.Bed, bed: { fuelId: FuelId.CharcoalBriquette, ...COMBUSTION_EXAMPLES.BED, nLayers: 10, kExcessAir: 1.3, tAirSecondary_K: 293 } }],
  ] as [string, CombustionModeInputDto][])('runs with mode %s', (_label, input) => {
    const r = service.calculate({ ...geometry, combustion: input, tAirStart_K: 293 });
    expect(r.tFlame_K).toBe(combustion.flueGas(input).tFlame_K);
    expect(r.tAirEnd_K).toBeGreaterThan(293);
    expect(r.energyReturnedPercent).toBeGreaterThan(0);
  });
});
