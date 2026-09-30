import { Test } from '@nestjs/testing';
import { CombustionModule } from '../../../../src/modules/combustion/combustion.module';
import { CombustionService } from '../../../../src/modules/combustion/services/combustion.service';
import { FuelId } from '../../../../src/modules/combustion/enums/fuel-id.enum';
import { FuelPhase } from '../../../../src/modules/combustion/data/fuels/fuel.interface';
import { CombustionMode } from '../../../../src/modules/combustion/enums/combustion-mode.enum';
import { BED_KINETICS } from '../../../../src/modules/combustion/constants/combustion.constants';
import { FluidFuelInputDto } from '../../../../src/modules/combustion/dto/fluid-fuel.dto';
import { SolidDirectInputDto } from '../../../../src/modules/combustion/dto/solid-direct.dto';
import { SolidTwoStepInputDto } from '../../../../src/modules/combustion/dto/solid-two-step.dto';
import { BedCombustionInputDto } from '../../../../src/modules/combustion/dto/bed-combustion.dto';

describe('CombustionService (facade)', () => {
  let service: CombustionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [CombustionModule] }).compile();
    service = moduleRef.get(CombustionService);
  });

  const fluid: FluidFuelInputDto = { phase: FuelPhase.Gas, fuelGas: { CH4: 1 }, fPower_W: 10_000, kExcessAir: 1.1, tAir_K: 293 };
  const direct: SolidDirectInputDto = { fuelId: FuelId.CharcoalBriquette, fPower_W: 10_000, kExcessAir: 1.2, tAir_K: 293, pO2: 0.23 };
  const twoStep: SolidTwoStepInputDto = {
    fuelId: FuelId.CharcoalOak, mFuel_kgs: 0.001, kExcessAir: 1.3, tAirPrimary_K: 673, tAirSecondary_K: 573,
  };
  const bed: BedCombustionInputDto = { fuelId: FuelId.CharcoalBriquette, nLayers: 10, kExcessAir: 1.3 };

  describe('flueGas() — flue gas of the selected mode', () => {
    it('fluid / solid-direct: flame, flows and composition of the mode result', () => {
      const r = service.fluidFuel(fluid);
      const f = service.flueGas({ mode: CombustionMode.Fluid, fluid });
      expect(f).toEqual({
        mode: CombustionMode.Fluid, tFlame_K: r.tFlame_K, mFuel_kgs: r.mFuel_kgs, fPower_W: r.fPower_W,
        mAir_kgs: r.mAir_kgs, mFlueGas_kgs: r.combustion.mGas_kgs, moleFractions: r.combustion.products.moleFractions,
        pO2: 0.21,
      });
      const d = service.flueGas({ mode: CombustionMode.SolidDirect, solidDirect: direct });
      expect(d.tFlame_K).toBe(service.solidDirect(direct).tFlame_K);
      expect(d.pO2).toBe(0.23);
    });

    it('two-step / bed: air = primary + secondary, flue gas = burnout step', () => {
      const r2 = service.solidTwoStep(twoStep);
      const f2 = service.flueGas({ mode: CombustionMode.SolidTwoStep, solidTwoStep: twoStep });
      expect(f2.tFlame_K).toBe(r2.tFlame_K);
      expect(f2.mAir_kgs).toBeCloseTo(r2.mAirPrimary_kgs + r2.mAirSecondary_kgs, 15);
      expect(f2.mFlueGas_kgs).toBe(r2.burnout.mGas_kgs);
      expect(f2.moleFractions).toEqual(r2.burnout.products.moleFractions);

      const r4 = service.bedCombustion(bed);
      const f4 = service.flueGas({ mode: CombustionMode.Bed, bed });
      expect(f4.tFlame_K).toBeCloseTo(r4.tFlame_K, 9);
      expect(f4.mAir_kgs).toBeCloseTo(r4.mAirPrimary_kgs + r4.mAirSecondary_kgs, 15);
      expect(f4.mFlueGas_kgs).toBeCloseTo(r4.burnout.mGas_kgs, 15);
    });

    it('airPreheat_K is added to every combustion air temperature', () => {
      const dT = 100;
      expect(service.flueGas({ mode: CombustionMode.SolidDirect, solidDirect: direct }, dT).tFlame_K)
        .toBe(service.solidDirect({ ...direct, tAir_K: direct.tAir_K + dT }).tFlame_K);
      expect(service.flueGas({ mode: CombustionMode.SolidTwoStep, solidTwoStep: twoStep }, dT).tFlame_K)
        .toBe(service.solidTwoStep({ ...twoStep, tAirPrimary_K: 773, tAirSecondary_K: 673 }).tFlame_K);
      expect(service.flueGas({ mode: CombustionMode.Bed, bed }, dT).tFlame_K)
        .toBeCloseTo(service.bedCombustion({ ...bed, tAirPrimary_K: BED_KINETICS.AIR_T_DEFAULT_K + dT }).tFlame_K, 9);
      expect(service.flueGas({ mode: CombustionMode.Fluid, fluid }, dT).tFlame_K)
        .toBeGreaterThan(service.flueGas({ mode: CombustionMode.Fluid, fluid }).tFlame_K);
    });

    it('needs exactly the input of the selected mode', () => {
      expect(() => service.flueGas({ mode: CombustionMode.Bed, fluid })).toThrow('needs `bed`');
      expect(() => service.flueGas({ mode: CombustionMode.Fluid, fluid, solidDirect: direct })).toThrow('Give only `fluid`');
    });
  });

  describe('mode endpoints and fuels', () => {
    it('lists the verified presets with derived properties', () => {
      const fuels = service.fuels();
      expect(fuels.map(f => f.id).sort()).toEqual([FuelId.CharcoalBriquette, FuelId.CharcoalOak, FuelId.MapPro].sort());
      expect(fuels.find(f => f.id === FuelId.MapPro)!.phase).toBe(FuelPhase.Gas);
      const briquette = fuels.find(f => f.id === FuelId.CharcoalBriquette)!;
      expect(briquette.heatOfFormation_Jkg).toBe(-8_500_000);
      expect(briquette.lhv_Jkg / 1e6).toBeCloseTo(22.95, 1);
      expect(briquette.stoichAir_kgkg).toBeGreaterThan(9);
      expect(briquette.stoichAir_kgkg).toBeLessThan(11);
    });

    it('delegates to the four mode services', () => {
      expect(service.solidDirect({ fuelId: FuelId.CharcoalBriquette, mFuel_kgs: 0.001, kExcessAir: 1.2, tAir_K: 293 }).tFlame_K)
        .toBeGreaterThan(1000);
      expect(service.solidTwoStep({ fuelId: FuelId.CharcoalOak, mFuel_kgs: 0.001, kExcessAir: 1.3, tAirPrimary_K: 673 }).tFlame_K)
        .toBeGreaterThan(1000);
      expect(service.fluidFuel({
        phase: FuelPhase.Gas, fuelGas: { CH4: 1 }, fPower_W: 10_000, kExcessAir: 1.1, tAir_K: 293,
      }).tFlame_K).toBeGreaterThan(1800);
      expect(service.bedCombustion({ fuelId: FuelId.CharcoalBriquette, nLayers: 10, kExcessAir: 1.3 }).tFlame_K)
        .toBeGreaterThan(1000);
    });
  });
});
