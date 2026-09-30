import { Test } from '@nestjs/testing';
import { ThermodynamicsModule } from '../../../../src/modules/thermodynamics/thermodynamics.module';
import { ThermalExchangeModule } from '../../../../src/modules/thermal-exchange/thermal-exchange.module';
import { CombustionEnthalpyService } from '../../../../src/modules/combustion/services/combustion-enthalpy.service';
import { ProductEquilibriumService } from '../../../../src/modules/combustion/services/product-equilibrium.service';
import { FlameSolverService } from '../../../../src/modules/combustion/services/flame-solver.service';
import { ChemicalKineticsService } from '../../../../src/modules/combustion/services/chemical-kinetics.service';
import { BedCombustionService } from '../../../../src/modules/combustion/services/bed-combustion.service';
import { BedCombustionInputDto, BedCombustionResultDto } from '../../../../src/modules/combustion/dto/bed-combustion.dto';
import { CHARCOAL_BRIQUETTE } from '../../../../src/modules/combustion/data/fuels';
import { FuelId } from '../../../../src/modules/combustion/enums/fuel-id.enum';
import { LayerDto } from '../../../../src/modules/thermal-exchange/dto/layer.dto';
import { RefractoryThermalMaterial } from '../../../../src/modules/refractory/enums/refractory-thermal-material.enum';

describe('BedCombustionService (mode 4)', () => {
  let bed: BedCombustionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThermodynamicsModule, ThermalExchangeModule],
      providers: [
        CombustionEnthalpyService, ProductEquilibriumService, FlameSolverService,
        ChemicalKineticsService, BedCombustionService,
      ],
    }).compile();
    bed = moduleRef.get(BedCombustionService);
  });

  // Briquette analysis and bed properties with LHV 30 MJ/kg (see mode 2 tests for the preset's ΔHf)
  const { id: _id, ref: _ref, page: _page, phase: _phase, ...briquette } = CHARCOAL_BRIQUETTE;
  const charcoal = { ...briquette, heatOfFormation_J_kg: undefined, lhv_J_kg: 30_000_000 };

  const base: BedCombustionInputDto = { fuel: charcoal, airFlow_m3h: 10, tAirPrimary_K: 400, nLayers: 20 };
  const wallLayers: LayerDto[] = [
    { material: RefractoryThermalMaterial.CHAMOTTE_SOLID, thicknessMm: 60 },
    { material: RefractoryThermalMaterial.CHAMOTTE_600,   thicknessMm: 60 },
  ];

  const energyResidual_K = (r: BedCombustionResultDto): number =>
    Math.abs(r.energyBalanceResidual_W) / (r.mGeneratorGas_kgs * 1000);

  let adiabatic: BedCombustionResultDto;
  beforeAll(() => { adiabatic = bed.calculate(base); });

  it('ignites at the grate: O2 is consumed low in the bed, char hotter than gas there', () => {
    const first = adiabatic.layers[0];
    expect(first.tSolid_K).toBeGreaterThan(first.tGas_K - first.deltaT_K);
    expect(adiabatic.mFuel_kgs).toBeGreaterThan(0);
    const top = adiabatic.layers[adiabatic.layers.length - 1];
    expect(top.moleFractions.O2).toBeLessThan(0.01);
    expect(adiabatic.tStep1_K).toBeGreaterThan(900);
    expect(adiabatic.tStep1_K).toBeLessThan(2500);
  });

  it('closes element and energy balances over the bed', () => {
    expect(adiabatic.elementBalanceResidual).toBeLessThan(1e-9);
    expect(energyResidual_K(adiabatic)).toBeLessThan(0.01);
    const massIn = adiabatic.mAirPrimary_kgs + adiabatic.mFuel_kgs;
    expect(adiabatic.mGeneratorGas_kgs + adiabatic.ash_kgs).toBeCloseTo(massIn, 12);
  });

  it('fuel burn rate follows carbon gasification and composition', () => {
    expect(adiabatic.carbonBurnRate_kgs).toBeCloseTo(adiabatic.mFuel_kgs * charcoal.elementalComp.C, 12);
    expect(adiabatic.fPower_W).toBeCloseTo(adiabatic.mFuel_kgs * 30e6, 6);
    const sumLayers = adiabatic.layers.reduce((s, l) => s + l.fuelBurnRate_kgs, 0);
    expect(sumLayers).toBeCloseTo(adiabatic.mFuel_kgs, 14);
  });

  it('produces a combustible generator gas (reduction zone above the oxidation zone)', () => {
    expect(adiabatic.generatorGasMoleFractions.CO).toBeGreaterThan(0.05);
    expect(adiabatic.primaryExcessAir).toBeLessThan(1);
    expect(adiabatic.pressureDrop_Pa).toBeGreaterThan(0);
    if (adiabatic.oxidationZoneHeight_m !== null) {
      expect(adiabatic.oxidationZoneHeight_m).toBeLessThan(0.5);
    }
  });

  it('extents never consume more than the inlet flow and layers are ordered by height', () => {
    for (let i = 1; i < adiabatic.layers.length; i++) {
      expect(adiabatic.layers[i].z_m).toBeGreaterThan(adiabatic.layers[i - 1].z_m);
    }
    for (const l of adiabatic.layers) {
      for (const v of Object.values(l.moleFractions)) expect(v).toBeGreaterThanOrEqual(0);
      for (const [r, x] of Object.entries(l.extents)) if (r !== 'r43') expect(x).toBeGreaterThanOrEqual(0);
    }
  });

  it('burnout with secondary air to total λ: complete combustion, hot flame', () => {
    const r = bed.calculate({ ...base, kExcessAir: 1.2 });
    const totalAir = r.mAirPrimary_kgs + r.mAirSecondary_kgs;
    expect(totalAir / r.mFuel_kgs).toBeCloseTo(1.2 * r.fuel.stoichAir_kgkg, 6);
    expect(r.burnout.excessAir).toBeGreaterThan(1);
    expect(r.burnout.products.moleFlows_mols.CO).toBe(0);
    expect(r.tFlame_K).toBeGreaterThan(r.tStep1_K);
    expect(r.burnout.elementBalanceResidual).toBeLessThan(1e-9);
  });

  it('without secondary air the burnout step only re-equilibrates the generator gas', () => {
    expect(adiabatic.mAirSecondary_kgs).toBe(0);
    expect(Math.abs(adiabatic.tFlame_K - adiabatic.tStep1_K)).toBeLessThan(150);
  });

  it('generator walls lose heat and cool the gas', () => {
    const r = bed.calculate({ ...base, generatorWallLayers: wallLayers });
    expect(r.generatorHeatLoss_W).toBeGreaterThan(0);
    expect(r.layers.some(l => l.tWallInner_K !== null)).toBe(true);
    expect(r.tStep1_K).toBeLessThan(adiabatic.tStep1_K);
    expect(energyResidual_K(r)).toBeLessThan(0.01);
  });

  it('furnace wall loss lowers the flame temperature', () => {
    const noLoss = bed.calculate({ ...base, kExcessAir: 1.2 });
    const withWall = bed.calculate({
      ...base, kExcessAir: 1.2, furnace: { diameter_m: 0.4, length_m: 1, wallLayers },
    });
    expect(withWall.burnout.heatLoss_W).toBeGreaterThan(0);
    expect(withWall.tFlame_K).toBeLessThan(noLoss.tFlame_K);
  });

  it('steam injection adds H2O after the max-CO2 layer and raises H2 in the generator gas', () => {
    const r = bed.calculate({ ...base, steamInjectionPercent: 10, steamT_K: 500 });
    expect(r.mSteam_kgs).toBeGreaterThan(0);
    expect(r.layers.filter(l => l.steamInjected)).toHaveLength(1);
    expect(r.generatorGasMoleFractions.H2).toBeGreaterThan(adiabatic.generatorGasMoleFractions.H2);
    expect(r.elementBalanceResidual).toBeLessThan(1e-9);
    expect(energyResidual_K(r)).toBeLessThan(0.01);
  });

  it('more blast air burns more fuel', () => {
    const more = bed.calculate({ ...base, airFlow_m3h: 20 });
    expect(more.mFuel_kgs).toBeGreaterThan(adiabatic.mFuel_kgs);
  });

  it('accepts a primary air mass flow equivalent to the volume flow', () => {
    const r = bed.calculate({ ...base, airFlow_m3h: undefined, mAirPrimary_kgs: adiabatic.mAirPrimary_kgs });
    expect(r.mFuel_kgs).toBeCloseTo(adiabatic.mFuel_kgs, 12);
  });

  it('rejects inconsistent input', () => {
    expect(() => bed.calculate({ ...base, mAirPrimary_kgs: 0.003 })).toThrow('at most one');
    expect(() => bed.calculate({ ...base, kExcessAir: 1.2, mAirSecondary_kgs: 0.01 })).toThrow('at most one');
    expect(() => bed.calculate({ ...base, fuel: { ...charcoal, porosity: undefined } })).toThrow('porosity');
    expect(() => bed.calculate({
      ...base, fuel: { ...charcoal, elementalComp: { ...charcoal.elementalComp, C: 0.84, S: 0.01 } },
    })).toThrow('sulphur');
  });

  it('runs with the verified briquette preset', () => {
    const r = bed.calculate({ fuelId: FuelId.CharcoalBriquette, nLayers: 20 });
    expect(r.mFuel_kgs).toBeGreaterThan(0);
    expect(r.elementBalanceResidual).toBeLessThan(1e-9);
    expect(energyResidual_K(r)).toBeLessThan(0.01);
  });
});
